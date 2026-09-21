import { isShadowRoot } from '@floating-ui/utils/dom';
import { clamp } from '@base-ui/utils/clamp';
import { resolveCollision, type CollisionResolutionRegistration } from './collisionResolution';
import type {
  DragInput,
  DragAccept,
  DragCleanupFn,
  DragKind,
  DragLocalPoint,
  DragSnappedLocalPointOptions,
  DragSnapSteps,
  DropEvent,
  DropTargetEvent,
  DropTargetResolutionContext,
  DropTargetEventTarget,
  DropTargetRecord,
  DragSource,
  DropTargetEventDetailsMap,
  DropTargetEventMap,
} from '../../types/drag';
import { matchesAccept } from './dragKind';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, safeCallConsumer } from './utils';
import { DROP_TARGET_ATTR } from './dragAttributes';
import { getParticipantPayload, resetParticipantPayload } from './participantData';
import { dragSessionStore, notifyDragTargetUpdated } from './dragSessionStore';

/** Getter for a single hook's latest drop-target parameters. */
type DropTargetGetter = () => RegisterDropTargetParameters<any, any, any, any>;

interface DropTargetState {
  /**
   * Maps each registered target element to the stack of parameter getters held
   * against it — one per registration whose ref landed on the node. Storing getters
   * rather than snapshots lets the React layer register once and have the engine read
   * the freshest callbacks on each dispatch; the last getter in the stack is the
   * active one. Each cleanup removes *its own* getter, by identity, so releasing a
   * non-last hold can't strand the surviving hook's callbacks.
   */
  registry: Map<Element, DropTargetGetter[]>;
  /**
   * How many registered drop targets live in each shadow root, so the sensor can
   * read the set without walking the registry (see {@link retainShadowRoot}).
   */
  shadowRoots: Map<ShadowRoot, number>;
  /**
   * The shadow roots each registered element was counted against, so the release
   * decrements what the retain incremented even if the node has since moved.
   */
  retainedRoots: WeakMap<Element, ShadowRoot[]>;
  /** Closed shadow roots indexed by host for pointer hit-testing. */
  shadowRootsByHost: Map<Element, ShadowRoot>;
  /** Whether the host index needs to be rebuilt. */
  shadowRootsByHostDirty: boolean;
}

const state = getSharedSlot<DropTargetState>('dropTarget', () => ({
  registry: new Map<Element, DropTargetGetter[]>(),
  shadowRoots: new Map<ShadowRoot, number>(),
  retainedRoots: new WeakMap<Element, ShadowRoot[]>(),
  shadowRootsByHost: new Map<Element, ShadowRoot>(),
  shadowRootsByHostDirty: true,
}));

type ShadowRootChangeListener = (root: ShadowRoot, registered: boolean) => void;

const shadowRootChangeListeners = getSharedSlot<Set<ShadowRootChangeListener>>(
  'dropTarget.shadowRootChangeListeners',
  () => new Set(),
);

const holds = createGetterStackRegistry<Element, DropTargetGetter>({
  entries: state.registry,
  onFirstAdd: (element) => {
    element.setAttribute(DROP_TARGET_ATTR, '');
    retainShadowRoot(element);
  },
  // Runs before `beforeDelete`, so the attribute is already gone when the
  // caller refreshes the lifecycle and the refreshed stack excludes this element.
  onLastRemove: (element) => {
    element.removeAttribute(DROP_TARGET_ATTR);
    releaseShadowRoot(element);
  },
});

/**
 * Ref-count the shadow root a target lives in, so the pointer sensor can read the
 * set in O(1) on the pickup frame.
 *
 * `scroll` does not compose, so a container scrolled inside a shadow tree never
 * reaches the sensor's document-level listener and it has to bind one per root.
 * Deriving that set at pickup cost a `getRootNode()` walk per registered target —
 * on the one frame that also builds the clone and places the preview — for a set
 * that is empty in essentially every app. Counted rather than a plain set because
 * one root holds many targets, and the last one leaving is what retires it.
 */
function retainShadowRoot(element: Element): void {
  const roots: ShadowRoot[] = [];
  let root = element.getRootNode();
  while (isShadowRoot(root)) {
    roots.push(root);
    const count = state.shadowRoots.get(root) ?? 0;
    state.shadowRoots.set(root, count + 1);
    if (count === 0) {
      state.shadowRootsByHostDirty = true;
      for (const listener of shadowRootChangeListeners) {
        listener(root, true);
      }
    }
    root = root.host.getRootNode();
  }
  if (roots.length > 0) {
    state.retainedRoots.set(element, roots);
  }
}

function releaseShadowRoot(element: Element): void {
  const retained = state.retainedRoots.get(element);
  if (retained === undefined) {
    return;
  }
  state.retainedRoots.delete(element);
  for (const root of retained) {
    const count = state.shadowRoots.get(root);
    if (count === undefined) {
      continue;
    }
    if (count <= 1) {
      state.shadowRoots.delete(root);
      state.shadowRootsByHostDirty = true;
      for (const listener of shadowRootChangeListeners) {
        listener(root, false);
      }
    } else {
      state.shadowRoots.set(root, count - 1);
    }
  }
}

/**
 * Every shadow root containing a registered drop target, including ancestor roots. The pointer
 * sensor binds a capture-phase `scroll` listener to each at pickup.
 */
export function getDropTargetShadowRoots(): Iterable<ShadowRoot> {
  return state.shadowRoots.keys();
}

/**
 * Closed shadow roots indexed by host for pointer hit-testing. The index changes
 * only when the registered root set changes, so drag frames can reuse it.
 */
export function getDropTargetShadowRootsByHost(): ReadonlyMap<Element, ShadowRoot> {
  const cached = state.shadowRootsByHost;
  if (!state.shadowRootsByHostDirty) {
    return cached;
  }

  cached.clear();
  for (const retained of state.shadowRoots.keys()) {
    let root: Node = retained;
    // A retained root can sit inside another shadow tree. Index each closed
    // boundary on the chain; open roots remain reachable through `host.shadowRoot`.
    while (isShadowRoot(root)) {
      if (root.mode === 'closed') {
        cached.set(root.host, root);
      }
      root = root.host.getRootNode();
    }
  }
  state.shadowRootsByHostDirty = false;
  return cached;
}

/** Watch roots entering and leaving the registered drop-target set. */
export function subscribeDropTargetShadowRoots(listener: ShadowRootChangeListener): DragCleanupFn {
  shadowRootChangeListeners.add(listener);
  return () => {
    shadowRootChangeListeners.delete(listener);
  };
}

/**
 * The active parameter getter for `element`: the last hold registered against
 * it, or `undefined` when nothing is registered.
 */
function getActiveRegistration(element: Element): DropTargetGetter | undefined {
  return holds.getActive(element);
}

/**
 * Getters for targets that unregistered while still hovered, held only until the
 * `onDraggableLeave` they are owed has gone out.
 *
 * `registrations.ts` routes a hovered target's unregister to the *synchronous*
 * refresh precisely so the leave dispatches while its registration is still
 * readable. That works until the unregister happens from inside a consumer
 * fan-out: the refresh can then only queue itself (`refreshPending`), while
 * `getterStackRegistry.remove`'s `finally` deletes the entry regardless — so by
 * the time the queued round runs, `getActiveRegistration` is `undefined` and
 * `dispatchToDropTarget` returns without dispatching anything.
 *
 * Module-level rather than per-session: the retiring element is the key, entries
 * are released the moment their leave is delivered, and {@link clearRetiringDropTargets}
 * sweeps whatever a torn-down drag left behind. Shared like every other registry
 * here: with a doubly-bundled engine, the copy that unregisters the hovered
 * target is not necessarily the copy whose queued refresh delivers the leave.
 */
const retiringRegistrations = getSharedSlot<Map<Element, DropTargetGetter>>(
  'dropTarget.retiring',
  () => new Map(),
);

/**
 * Hold `getParameters` readable across this element's unregistration.
 *
 * Only takes effect while `getParameters` is still the element's active hold,
 * that is, when the element is leaving the registry entirely. The unregister
 * callback also runs when a non-last hold is released and a survivor is promoted
 * (see `getterStackRegistry`), but the element stays registered then and its
 * leave, if any, dispatches through the survivor.
 */
export function retainRetiringDropTarget(element: Element, getParameters: DropTargetGetter): void {
  if (holds.getActive(element) === getParameters) {
    retiringRegistrations.set(element, getParameters);
  }
}

/** Drop the retiring hold once the element's terminal leave has been dispatched. */
function releaseRetiringDropTarget(element: Element): void {
  retiringRegistrations.delete(element);
}

/** Drop every retiring hold; run from the lifecycle's teardown. */
export function clearRetiringDropTargets(): void {
  retiringRegistrations.clear();
}

/**
 * Register `element` as a drop target with a live parameters getter, pushing it
 * onto the element's stack of holds. Returns `true` when this was the first
 * registration on the element, so the caller can run first-time side effects. Pass
 * the same `getParameters` to {@link removeDropTargetRegistration} so each hold
 * releases its own getter.
 */
export function addDropTargetRegistration(
  element: Element,
  getParameters: DropTargetGetter,
): boolean {
  return holds.add(element, getParameters);
}

const targetDragData = getSharedSlot(
  'dropTarget.dragData',
  () =>
    new WeakMap<
      DragSource,
      WeakMap<DropTargetGetter, Map<symbol | undefined, { value: unknown }>>
    >(),
);

/**
 * Drop one registration hold on `element`, removing {@link DROP_TARGET_ATTR} only
 * when the last hold is released. Returns `true` when it removed the target
 * entirely. `beforeDelete` runs before the registry entry is deleted, so a caller
 * can refresh the lifecycle while the registration is still readable, for the
 * `onDraggableLeave` dispatch.
 */
export function removeDropTargetRegistration(
  element: Element,
  getParameters: DropTargetGetter,
  beforeDelete?: () => void,
): boolean {
  try {
    return holds.remove(element, getParameters, beforeDelete);
  } finally {
    resetParticipantPayload(getParameters);
    const source = dragSessionStore.state?.source;
    if (source) {
      targetDragData.get(source)?.delete(getParameters);
    }
  }
}

/**
 * Clear every drop-target registration so a detached target left registered by a
 * failed or aborted test can't leak into the next one. Test-only; called from the
 * drag engine's `resetDrag()` teardown.
 */
export function resetForTests(): void {
  for (const element of state.registry.keys()) {
    element.removeAttribute(DROP_TARGET_ATTR);
  }
  state.registry.clear();
  state.shadowRoots.clear();
  state.retainedRoots = new WeakMap<Element, ShadowRoot[]>();
  state.shadowRootsByHost.clear();
  state.shadowRootsByHostDirty = true;
  shadowRootChangeListeners.clear();
  retiringRegistrations.clear();
}

type ConsumerCallbackName = 'canDrop' | 'snap' | 'getParameters' | 'collision';

/**
 * The active drag's pickup grab offset: the pointer at pickup minus the source's
 * border-box origin, in client pixels, measured before any `[data-dragging]`
 * styling applies. Written by the lifecycle for the session's duration and
 * captured per record for `getSnappedLocalPoint({ anchor: 'source' })`. Shared
 * like the registries: the copy that started the drag and the copy resolving
 * targets can be different bundle copies.
 */
const grabOffsetSlot = getSharedSlot<{ current: { x: number; y: number } | null }>(
  'dropTarget.grabOffset',
  () => ({ current: null }),
);

/** Lifecycle-only writer; pass `null` on teardown. */
export function setSessionGrabOffset(offset: { x: number; y: number } | null): void {
  grabOffsetSlot.current = offset;
}

/**
 * A throwing callback costs the target its registration for this dispatch, so one
 * buggy target can't cancel drag resolution for every other target on the page.
 */
function safeCall<T>(
  callbackName: ConsumerCallbackName,
  element: Element,
  call: () => T,
  fallback: T,
): T {
  return safeCallConsumer('drop target', callbackName, element, call, fallback);
}

/**
 * `resolveDropTargetOutcome`'s third answer: the target's `canDrop` returned
 * `'reject'`, refusing the drop outright rather than abstaining. Internal: the
 * walk turns it into an empty stack.
 */
const DROP_REJECTED = Symbol('base-ui.dropTarget.rejected');

const recordRegistrations = getSharedSlot(
  'dropTarget.recordRegistrations',
  () => new WeakMap<DropTargetRecord, RegisterDropTargetParameters<any, any, any, any>>(),
);

/**
 * The frozen copy held against each parameters object a getter has returned.
 * A record needs a copy (see `recordRegistrations`), but resolution produces a
 * record per walked target per frame, while the React layer hands back the same
 * parameters object until the target re-renders — so copy once per object and
 * share it across the records resolved from it.
 */
const registrationSnapshots = getSharedSlot(
  'dropTarget.registrationSnapshots',
  () =>
    new WeakMap<
      RegisterDropTargetParameters<any, any, any, any>,
      RegisterDropTargetParameters<any, any, any, any>
    >(),
);

function snapshotRegistration(
  registration: RegisterDropTargetParameters<any, any, any, any>,
): RegisterDropTargetParameters<any, any, any, any> {
  let snapshot = registrationSnapshots.get(registration);
  if (snapshot === undefined) {
    snapshot = { ...registration };
    registrationSnapshots.set(registration, snapshot);
  }
  return snapshot;
}

/** Apply committed payload props, including changes between drags. */
export function syncDropTargetPayload(
  element: Element | null,
  kind: symbol | undefined,
  payload: unknown,
): void {
  if (!element) {
    return;
  }
  const getter = getActiveRegistration(element);
  if (!getter) {
    return;
  }
  const payloadState = getParticipantPayload(getter, kind, payload);
  const source = dragSessionStore.state?.source;
  const changed = payloadState.sync(payload);
  if (source && changed) {
    notifyDragTargetUpdated(source, element);
  }
}

const collisionResolvers = new WeakMap<
  DropTargetRecord,
  NonNullable<CollisionResolutionRegistration[typeof resolveCollision]>
>();

/** Measure only the winning participant, immediately before dispatch can mutate its layout. */
export function captureDropTargetCollision(
  target: DropTargetRecord | undefined | null,
  input: DragInput,
  source: DragSource,
  isDrop = false,
): void {
  if (!target) {
    return;
  }
  const capture = collisionResolvers.get(target);
  if (capture) {
    safeCall(
      'collision',
      target.element,
      () => capture(target, { element: target.element, input, source, isDrop }),
      undefined,
    );
  }
}

/**
 * Resolve a single element against the active drag: returns a `DropTargetRecord`
 * when the element is registered, not `disabled`, and its `accept` and
 * `canDrop` both pass; `null` when it abstains; {@link DROP_REJECTED} when its
 * `canDrop` refuses the drop outright. Shared by the DOM walk in
 * `getDropTargetsOver` so pointer resolution uses one set of rules.
 */
function resolveDropTargetOutcome(
  element: Element,
  feedback: Omit<DropTargetResolutionContext, 'element'>,
): DropTargetRecord | null | typeof DROP_REJECTED {
  const getRegistration = getActiveRegistration(element);
  if (!getRegistration) {
    return null;
  }
  // The getter is consumer-supplied through the public imperative API. An
  // uncontained throw here would abort the whole resolution walk (and, from the
  // initial resolution in `start()`, tear the drag down before it began), so
  // treat a throwing getter like an unregistered target instead.
  const registration = safeCall('getParameters', element, getRegistration, null);
  if (registration === null) {
    return null;
  }
  // A disabled target is not a candidate at all — like a failed `canDrop`, the
  // walk falls through to ancestor targets.
  if (registration.disabled) {
    return null;
  }
  // Cheap kind filter first, before allocating the feedback object. This path
  // runs per walked target per frame, where most targets fail here.
  if (!matchesAccept(registration.accept, feedback.source as DragSource)) {
    return null;
  }
  const fullFeedback: DropTargetResolutionContext = { ...feedback, element };

  // Then dynamic `canDrop`, with throws contained per-target so they don't abort the walk.
  const canDropVerdict = registration.canDrop
    ? safeCall('canDrop', element, () => registration.canDrop!(fullFeedback), false)
    : true;

  if (canDropVerdict === 'reject') {
    return DROP_REJECTED;
  }
  if (!canDropVerdict) {
    return null;
  }

  const payloadState = getParticipantPayload(
    getRegistration,
    registration.kind?.id,
    registration.payload,
  );
  payloadState.sync(registration.payload);
  const source = feedback.source;
  let sessionTargets = targetDragData.get(source);
  if (!sessionTargets) {
    sessionTargets = new WeakMap();
    targetDragData.set(source, sessionTargets);
  }
  let registrationData = sessionTargets.get(getRegistration);
  if (!registrationData) {
    registrationData = new Map();
    sessionTargets.set(getRegistration, registrationData);
  }
  const kind = registration.kind?.id;
  let dragDataState = registrationData.get(kind);
  if (!dragDataState) {
    dragDataState = { value: undefined };
    registrationData.set(kind, dragDataState);
  }
  const data = dragDataState;
  const record: DropTargetRecord = {
    element,
    kind,
    get payload() {
      return payloadState.payload;
    },
    updatePayload(nextPayload) {
      if (payloadState.update(nextPayload)) {
        const activeSource = dragSessionStore.state?.source;
        notifyDragTargetUpdated(
          activeSource && getActiveRegistration(element) === getRegistration
            ? activeSource
            : source,
          element,
        );
      }
    },
    get dragData() {
      return data.value;
    },
    updateDragData(nextDragData) {
      if (!Object.is(data.value, nextDragData)) {
        data.value = nextDragData;
        notifyDragTargetUpdated(source, element);
      }
    },
    ...createLocalPointReaders(element, fullFeedback, registration.snap),
  };
  recordRegistrations.set(record, snapshotRegistration(registration));
  const captureCollision = (registration as CollisionResolutionRegistration)[resolveCollision];
  if (captureCollision) {
    collisionResolvers.set(record, captureCollision);
  }
  return record;
}

/**
 * Quantize one axis of a local point: clamp to `0`–`1`, then round to the nearest
 * of `steps` equal fractions. `Math.round`, deliberately: it is symmetric around
 * every step midpoint, so drags carry no directional bias, where a `ceil` or
 * `floor` would shift every drop one way.
 * A missing, non-integer, or non-positive count leaves the axis unquantized.
 */
function snapAxis(value: number, steps: number | undefined): number {
  const clamped = clamp(value, 0, 1);
  if (steps === undefined || !Number.isInteger(steps) || steps <= 0) {
    return clamped;
  }
  return Math.round(clamped * steps) / steps;
}

/**
 * Build the record's `getLocalPoint` and `getSnappedLocalPoint`, deferring the
 * measurement until something asks.
 *
 * Resolution here is a DOM walk — `elementFromPoint` then the ancestor climb — so no rect is
 * measured. Computing the point eagerly would charge every drag a
 * `getBoundingClientRect()` per resolved target to serve the drags that read it. The
 * two readers share one measurement, and a `snap` callback runs at most once per
 * record, on the first snapped read. Layout is final by then, which is what makes
 * a runtime-derived step count (visible hours, a zoom level) safe to declare.
 *
 * The point is fixed at resolution and the element is not, so a caller holding a record
 * past its frame gets the pointer where it was against the element where it is now. Same
 * as `payload`, which is also resolved once and read later. The grab offset is captured
 * now for the same reason: a record can outlive its drag, when the session slot is gone.
 */
function createLocalPointReaders(
  element: Element,
  context: DropTargetResolutionContext,
  snap: RegisterDropTargetParameters<any, any, any, any>['snap'],
): Pick<DropTargetRecord, 'getLocalPoint' | 'getSnappedLocalPoint'> {
  const { clientX, clientY } = context.input;
  const grabOffset = grabOffsetSlot.current;

  let rect: DOMRect | null = null;
  function measureRect(): DOMRect {
    if (rect === null) {
      rect = element.getBoundingClientRect();
    }
    return rect;
  }

  function localPoint(offsetX: number, offsetY: number): DragLocalPoint {
    const measured = measureRect();
    // Zero on an axis with no extent, which is what an empty or detached element
    // measures as, rather than dividing by it.
    return {
      x: measured.width === 0 ? 0 : (clientX - offsetX - measured.left) / measured.width,
      y: measured.height === 0 ? 0 : (clientY - offsetY - measured.top) / measured.height,
    };
  }

  let rawMemo: DragLocalPoint | null = null;
  const getLocalPoint = (): DragLocalPoint => {
    if (rawMemo === null) {
      rawMemo = localPoint(0, 0);
    }
    return rawMemo;
  };

  let steps: DragSnapSteps | undefined;
  let stepsResolved = false;
  function resolveSteps(): DragSnapSteps | undefined {
    if (!stepsResolved) {
      stepsResolved = true;
      steps =
        typeof snap === 'function'
          ? safeCall('snap', element, () => snap(context), undefined)
          : snap;
    }
    return steps;
  }

  const snappedMemos: {
    pointer?: DragLocalPoint | undefined;
    source?: DragLocalPoint | undefined;
  } = {};
  const getSnappedLocalPoint = (options?: DragSnappedLocalPointOptions): DragLocalPoint => {
    // Documented fallback: `'source'` with no grab offset known (no live session
    // at resolution) anchors on the pointer rather than failing.
    const anchor = options?.anchor === 'source' && grabOffset !== null ? 'source' : 'pointer';
    let memo = snappedMemos[anchor];
    if (memo === undefined) {
      const resolved = resolveSteps();
      const point =
        anchor === 'source' ? localPoint(grabOffset!.x, grabOffset!.y) : getLocalPoint();
      memo = {
        x: snapAxis(point.x, resolved?.x),
        y: snapAxis(point.y, resolved?.y),
      };
      snappedMemos[anchor] = memo;
    }
    return memo;
  };

  return { getLocalPoint, getSnappedLocalPoint };
}

/**
 * Walk up the composed tree from `target` and collect every registered,
 * non-disabled drop target whose `accept` and `canDrop` both pass.
 * Bubble-ordered, innermost first.
 *
 * One composed walk (`getComposedParentElement`) rather than `closest()`: the
 * latter follows the light-DOM parent chain straight through a shadow host, so a
 * target in the shadow tree that wraps the `<slot>` the node is assigned to would
 * be skipped whenever a light-DOM ancestor is also a target. Entering the
 * assigned slot before climbing, and crossing out through the host afterwards,
 * visits every ancestor in the order events bubble.
 *
 * A `canDrop` returning `'reject'` ends the walk with an empty stack: the
 * rejecting target refuses the drop outright rather than abstaining, so its
 * descendants that accepted are discarded (a container-level rule such as a
 * capacity limit holds without every child repeating it) and nothing above it
 * can claim the drop either. `onReject` reports the rejecting element so the
 * lifecycle can surface it as `data-rejected`.
 */
export function getDropTargetsOver(
  target: Element | null,
  feedback: Omit<DropTargetResolutionContext, 'element'>,
  onReject?: (element: Element) => void,
): DropTargetRecord[] {
  const result: DropTargetRecord[] = [];

  for (let node = target; node !== null; node = getComposedParentElement(node)) {
    // Keyed on the attribute, not the registry: while a target unregisters, its
    // entry outlives the attribute (`onLastRemove` runs before `beforeDelete`)
    // so its `onDraggableLeave` can still dispatch from the refresh, yet the
    // refreshed stack must already exclude it.
    if (!node.hasAttribute(DROP_TARGET_ATTR)) {
      continue;
    }
    const outcome = resolveDropTargetOutcome(node, feedback);
    if (outcome === DROP_REJECTED) {
      result.length = 0;
      onReject?.(node);
      return result;
    }
    if (outcome) {
      result.push(outcome);
    }
  }

  return result;
}

// `onMoveEnd` is source/monitor only, so it is excluded from the indexable key set.
type DropTargetEventName = keyof DropTargetEventMap & keyof RegisterDropTargetParameters;

/**
 * Pre-capture the active registration getter for a record so a later dispatch
 * survives the target unregistering in between. Used by the drop path: the
 * source's `onMoveEnd` (told the drop landed first) may synchronously tear
 * down its zones, and the drop it was just told about must still be delivered.
 */
export function captureDropTargetRegistration(
  record: DropTargetRecord,
): (() => RegisterDropTargetParameters<any, any, any, any>) | undefined {
  return getActiveRegistration(record.element);
}

export function dispatchToDropTarget<K extends DropTargetEventName>(
  record: DropTargetRecord,
  eventName: K,
  payload: DropTargetEventMap[K],
  eventDetails: DropTargetEventDetailsMap[K],
  capturedRegistration?: () => RegisterDropTargetParameters<any, any, any, any>,
): void {
  const getRegistration =
    capturedRegistration ??
    getActiveRegistration(record.element) ??
    // Unregistered while hovered, with its leave still owed (see
    // `retiringRegistrations`).
    retiringRegistrations.get(record.element);
  if (!getRegistration) {
    return;
  }
  // Same containment as `resolveDropTarget`: a throwing consumer getter must
  // cost this target its event, not unwind the whole dispatch sequence.
  const registration = safeCall('getParameters', record.element, getRegistration, null);
  if (registration === null) {
    return;
  }
  // A leave can outlive the kind contract that produced its record.
  const compatible =
    matchesAccept(registration.accept, payload.source) && registration.kind?.id === record.kind;
  const parameters = compatible ? registration : recordRegistrations.get(record);
  if (!parameters) {
    return;
  }
  const handler = parameters[eventName] as
    | ((
        parameters: DropTargetEventMap[K] & DropTargetEventTarget,
        eventDetails: DropTargetEventDetailsMap[K],
      ) => void)
    | undefined;
  handler?.({ ...payload, target: record }, eventDetails);
}

/** Remove the record held against `element` from the hovered bookkeeping. */
function removeHoveredRecord(hovered: DropTargetRecord[], element: Element): void {
  const index = hovered.findIndex((record) => record.element === element);
  if (index !== -1) {
    hovered.splice(index, 1);
  }
}

/** Swap the stale record for `fresh` (same element) in the hovered bookkeeping. */
function replaceHoveredRecord(hovered: DropTargetRecord[], fresh: DropTargetRecord): void {
  const index = hovered.findIndex((record) => record.element === fresh.element);
  if (index === -1) {
    hovered.push(fresh);
  } else {
    hovered[index] = fresh;
  }
}

/**
 * Swap every record in the hovered bookkeeping for its freshly resolved counterpart,
 * matched by element, without adding or removing entries. Used by the lifecycle on
 * frames where the resolved stack is element-equal to the previous one: no change
 * dispatch runs there, yet the terminal `onDraggableLeave` on drop or cancel reads these
 * records — without the swap it would report the `target.payload` resolved at entry
 * time while every intermediate `onDraggableMove` reported fresh ones.
 */
export function refreshHoveredRecords(
  hovered: DropTargetRecord[],
  fresh: readonly DropTargetRecord[],
): void {
  // Runs on every element-equal move frame: between change dispatches the hovered
  // list mirrors the resolved stack order, so the index-aligned record almost always
  // matches — scan only on a mismatch, keeping the per-frame path allocation-free.
  for (let i = 0; i < hovered.length; i += 1) {
    if (fresh[i]?.element === hovered[i].element) {
      hovered[i] = fresh[i];
      continue;
    }
    for (let j = 0; j < fresh.length; j += 1) {
      if (fresh[j].element === hovered[i].element) {
        hovered[i] = fresh[j];
        break;
      }
    }
  }
}

/**
 * Deliver the terminal `onDraggableLeave` one still-hovered target is owed at the
 * end of a drag.
 *
 * Distinct from a one-record {@link dispatchDropTargetChange} round: that one
 * ends by resetting `hovered` to the (empty) current stack, so after the first
 * target's leave the remaining targets would already read as not hovered. A leave
 * handler that unregisters a sibling then routes it down the coalesced path,
 * which cannot dispatch the leave that sibling is still owed. Here `hovered` only
 * loses the record being left, so every other target stays hovered until its own
 * leave goes out.
 */
export function dispatchTerminalDropTargetLeave(
  record: DropTargetRecord,
  payload: DropTargetEventMap['onDraggableLeave'],
  eventDetails: DropTargetEventDetailsMap['onDraggableLeave'],
  hovered: DropTargetRecord[],
): void {
  // Removed before the leave is delivered, as in `dispatchDropTargetChange`.
  removeHoveredRecord(hovered, record.element);
  try {
    dispatchToDropTarget(record, 'onDraggableLeave', payload, eventDetails);
  } finally {
    releaseRetiringDropTarget(record.element);
  }
}

/**
 * Dispatch `onTargetChange` to every previous and current target, plus
 * `onDraggableLeave` for targets that left and `onDraggableEnter` for targets that entered.
 *
 * `shouldContinue` is re-checked before every delivery: a handler can cancel the
 * drag re-entrantly, and the remaining targets must then receive nothing, as the
 * cancel already delivered their terminal events. `hovered` is the lifecycle's
 * hovered-stack bookkeeping, mutated as enters and leaves are actually delivered so
 * an interrupted dispatch leaves it describing exactly the targets that still hold
 * hover state.
 */
export function dispatchDropTargetChange(
  previous: readonly DropTargetRecord[],
  current: readonly DropTargetRecord[],
  payload: DropTargetEventMap['onDraggableEnter'],
  eventDetails: DropTargetEventDetailsMap['onDraggableEnter'],
  shouldContinue: () => boolean,
  hovered: DropTargetRecord[],
): void {
  const currByElement = new Map(current.map((r) => [r.element, r] as const));
  const visited = new Set<Element>();

  for (const record of previous) {
    if (!shouldContinue()) {
      return;
    }
    visited.add(record.element);
    // Keep a persisting target's payload current for later dispatch.
    const fresh = currByElement.get(record.element);
    if (fresh) {
      replaceHoveredRecord(hovered, fresh);
    } else {
      // Removed before the leave is delivered: if the leave handler cancels the
      // drag, the terminal dispatch must not re-leave this target.
      removeHoveredRecord(hovered, record.element);
      try {
        dispatchToDropTarget(record, 'onDraggableLeave', payload, eventDetails);
      } finally {
        releaseRetiringDropTarget(record.element);
      }
    }
  }

  for (const record of current) {
    if (!shouldContinue()) {
      return;
    }
    if (visited.has(record.element)) {
      continue;
    }
    // Added before delivery: if the enter handler cancels the
    // drag, the terminal dispatch owes this target a balancing leave.
    hovered.push(record);
    dispatchToDropTarget(record, 'onDraggableEnter', payload, eventDetails);
  }

  // Fully delivered: sync the bookkeeping to the canonical, bubble-ordered stack.
  hovered.length = 0;
  hovered.push(...current);
}

export function dispatchToAllDropTargets<K extends DropTargetEventName>(
  targets: readonly DropTargetRecord[],
  eventName: K,
  payload: DropTargetEventMap[K],
  eventDetails: DropTargetEventDetailsMap[K],
  shouldContinue: () => boolean,
): void {
  for (const record of targets) {
    // A handler can cancel the drag re-entrantly; the remaining targets must then
    // receive nothing.
    if (!shouldContinue()) {
      return;
    }
    dispatchToDropTarget(record, eventName, payload, eventDetails);
  }
}

/**
 * Parameters accepted by `Draggable.Target` and `registerDropTarget`, except the element.
 *
 * `TSourcePayload` is the payload the accepted kinds carry and `TTargetPayload` this target's
 * own. `Draggable.Target` and `registerDropTarget` infer both, from `accept` and
 * `payload` respectively.
 */
export type RegisterDropTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = {
  /**
   * The payload to attach to this target, read back as `target.payload` in its own
   * callbacks and on its record in `location.current.dropTargets`. Use it to identify which
   * cell, row, or column a drag is over. Functions are preserved as ordinary
   * payload values.
   */
  payload?: TTargetPayload | undefined;
  /**
   * The target kind created with `Draggable.createKind`. It is available as
   * `target.kind` and on entries in `location.current.dropTargets`. Use the kind's `matches`
   * method to distinguish target kinds and narrow their payload types. Its payload
   * type must match this target's `payload`.
   *
   * Distinct from `accept`, which declares the **source** kinds this target takes.
   */
  kind?: DragKind<NoInfer<TTargetPayload>, TTargetDragData> | undefined;
  /**
   * One or more drag source kinds accepted by this target.
   *
   * Optional on `Draggable.Target`, where it defaults to the nearest provider's
   * no-payload kind; required on `registerDropTarget`, which joins the page-wide
   * manager directly. Pass `Draggable.anyKind` to accept every drag. In that case,
   * `source.payload` is `unknown`.
   *
   * The target ignores a source whose kind is not accepted. An ancestor target can
   * still accept it. Base UI checks `accept` before `canDrop`.
   */
  accept?: DragAccept<TSourcePayload, TDragData> | undefined;
  /**
   * Whether the drop target should ignore user interaction. A disabled target is
   * skipped by target resolution as if it weren't registered, so drags fall through
   * to ancestor targets. A hovered target disabled mid-drag leaves the active stack,
   * with its `onDraggableLeave`, on the next resolution.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Predicate for whether this target should be considered a candidate for the
   * current drag. Runs after `accept`.
   *
   * Return `false` to skip this target for the current resolution. Base UI continues
   * through its ancestors, so a parent target can receive the drop. This differs from
   * ignoring the drop inside `onDraggableDrop`, which does not give a parent target a chance.
   *
   * Return `'reject'` to block every drop at this position. Descendants, this target,
   * and ancestors cannot receive the drop. While the drag is over the target, it has
   * `data-rejected`. Use this for container rules such as a capacity limit. Returning
   * `false` would allow an item inside the container to receive the drop.
   */
  canDrop?:
    | ((
        parameters: DropTargetResolutionContext<NoInfer<TSourcePayload>, NoInfer<TDragData>>,
      ) => boolean | 'reject')
    | undefined;
  /**
   * Divides the target's border box into equal steps for
   * `getSnappedLocalPoint()`. For example, `{ y: 96 }` creates 15-minute slots in
   * a day column, and `{ x: 7, y: 6 }` creates a month grid.
   *
   * Step counts do not depend on the target's pixel size. Pass a static value or
   * a callback that receives the same context as `canDrop`. Return `undefined`
   * to skip snapping.
   *
   * This differs from `snapToGrid`, which snaps the drag position for every target.
   * `snap` changes only the value reported by this target.
   */
  snap?:
    | DragSnapSteps
    | ((
        context: DropTargetResolutionContext<NoInfer<TSourcePayload>, NoInfer<TDragData>>,
      ) => DragSnapSteps | undefined)
    | undefined;
  /**
   * Event handler called when a matching drag starts while this target is already
   * under the pointer. It does not fire for drags that start elsewhere; use a
   * monitor's `onMoveStart` to observe every drag.
   */
  onDraggableStart?:
    | ((
        parameters: DropTargetEvent<
          'onDraggableStart',
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
        eventDetails: DropTargetEventDetailsMap['onDraggableStart'],
      ) => void)
    | undefined;
  /**
   * Event handler called on each animation frame when the pointer or modifier
   * keys change while the target is in the active stack. A target entered mid-drag
   * also receives it on the frame it enters, right after `onDraggableEnter`; a
   * target under the pointer at pickup receives `onDraggableStart` and
   * `onDraggableEnter` only, then this on the first move. Put hover-tracking work
   * here and use `onDraggableEnter` for enter-only side effects.
   */
  onDraggableMove?:
    | ((
        parameters: DropTargetEvent<
          'onDraggableMove',
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
        eventDetails: DropTargetEventDetailsMap['onDraggableMove'],
      ) => void)
    | undefined;
  /** Event handler called when this target enters the active stack. */
  onDraggableEnter?:
    | ((
        parameters: DropTargetEvent<
          'onDraggableEnter',
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
        eventDetails: DropTargetEventDetailsMap['onDraggableEnter'],
      ) => void)
    | undefined;
  /**
   * Event handler called when this target leaves the active stack, because the
   * pointer or modifier keys moved it away, or the drag ended. `eventDetails.reason`
   * identifies what changed.
   */
  onDraggableLeave?:
    | ((
        parameters: DropTargetEvent<
          'onDraggableLeave',
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
        eventDetails: DropTargetEventDetailsMap['onDraggableLeave'],
      ) => void)
    | undefined;
  /**
   * Event handler called on the innermost active drop target only, when the user
   * releases the drag over it. Ancestor targets in the same stack do not receive
   * `onDraggableDrop`, and it never fires on a cancel. To observe every drag end regardless of
   * target depth or cancellation, use the source's or a monitor's `onMoveEnd`.
   */
  onDraggableDrop?:
    | ((
        parameters: DropEvent<
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
        eventDetails: DropTargetEventDetailsMap['onDraggableDrop'],
      ) => void)
    | undefined;
};
