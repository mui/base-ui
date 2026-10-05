import { isShadowRoot } from '@floating-ui/utils/dom';
import { clamp } from '@base-ui/utils/clamp';
import type { DraggableAccept, DraggableKind } from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type {
  DraggableTargetLocalPoint,
  DraggableTargetSnappedLocalPointOptions,
  DraggableTargetSnapSteps,
  DraggableTargetResolutionContext,
  DraggableTargetRecord,
  DraggableTargetStartEventDetails,
  DraggableTargetMoveEventDetails,
  DraggableTargetEnterEventDetails,
  DraggableTargetLeaveEventDetails,
  DraggableTargetDropEventDetails,
} from '../../draggable/target/DraggableTarget';
import type {
  DragCleanupFn,
  DragEventDetails,
  DropTargetChangeEventDetails,
  DropTargetEventDetails,
  DropTargetEventReasonMap,
} from './types';
import { matchesAccept } from './dragKind';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import {
  getComposedParentElement,
  getOrCreate,
  getShallowSnapshot,
  safeCallConsumer,
} from './utils';
import { resetParticipantPayload, syncParticipantPayload } from './participantData';
import { dragSessionStore, notifyDragTargetUpdated } from './dragSessionStore';

/**
 * Marks every registered drop target so the hit-test walk can find them with one selector.
 * The `data-base-ui-` prefix means it's internal, not a styling hook.
 */
const DROP_TARGET_ATTR = 'data-base-ui-drop-target';

type AnyDropTargetParameters = DropTargetParameters<any, any, any, any>;
/** Getter for a single hook's latest drop-target parameters. */
type DropTargetGetter = () => AnyDropTargetParameters;

type ShadowRootChangeListener = (root: ShadowRoot, registered: boolean) => void;

/** A registration's `dragData`, scoped to one drag and one target kind. */
interface TargetDragData {
  source: DraggableRootRecord;
  kind: symbol | undefined;
  value: unknown;
}

/** The registration a record was resolved from. */
interface RecordRegistration {
  getParameters: DropTargetGetter;
  /** See {@link DropTargetState.registrationSnapshots}. */
  snapshot: AnyDropTargetParameters;
}

/**
 * Shared across bundle copies. When the engine is bundled twice, the copy that
 * registers a target, the copy that started the drag, and the copy that
 * dispatches to targets can all differ.
 */
interface DropTargetState {
  /** Each registered target element's stack of parameter getters (see `getterStackRegistry`). */
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
  /**
   * Closed shadow roots indexed by host for pointer hit-testing, kept in sync
   * with `shadowRoots`. Open roots don't need it, since `host.shadowRoot` reaches them.
   */
  shadowRootsByHost: Map<Element, ShadowRoot>;
  /** Told when a root joins or leaves `shadowRoots` (see {@link trackDropTargetShadowRoots}). */
  shadowRootChangeListeners: Set<ShadowRootChangeListener>;
  /**
   * Getters for targets that unregistered while hovered, held until the
   * `onDraggableLeave` they are owed goes out.
   *
   * `registrations.ts` routes a hovered target's unregister to the synchronous
   * refresh so the leave dispatches while its registration is still readable.
   * That fails when the unregister happens inside a consumer fan-out or before
   * `onMoveStart`. The refresh can then only queue itself (`refreshPending`), and
   * the `finally` in `getterStackRegistry.remove` deletes the entry anyway. When
   * the queued round runs, the element has no active hold and `dispatchToDropTarget`
   * has nothing to dispatch through.
   *
   * Keyed by element rather than per session. An entry is released as soon as its
   * leave goes out, and {@link endDropTargetSession} sweeps whatever a torn-down
   * drag left behind.
   */
  retiring: Map<Element, DropTargetGetter>;
  /** The active drag's source, set by the lifecycle for the session's duration. */
  sessionSource: DraggableRootRecord | null;
  /**
   * The active drag's grab offset. It is the pointer position at pickup minus the
   * source's border-box origin, in client pixels, measured before `[data-dragging]`
   * styles apply. Each record captures it for `getSnappedLocalPoint({ anchor: 'source' })`.
   */
  grabOffset: { x: number; y: number } | null;
  /**
   * The key each registration's payload and `dragData` are stored under, per
   * element and getter (see {@link getRegistrationKey}).
   */
  registrationKeys: WeakMap<Element, WeakMap<DropTargetGetter, object>>;
  /**
   * Each registration's `dragData` for the active drag, by registration key,
   * replaced when its target kind changes. Emptied when the drag ends, because a
   * mounted target keeps its key alive and a leftover entry would retain the
   * finished drag's source.
   */
  dragData: WeakMap<object, TargetDragData>;
  recordRegistrations: WeakMap<DraggableTargetRecord, RecordRegistration>;
  /**
   * The frozen copy of each parameters object a getter has returned.
   * A record keeps a copy rather than the object itself because a getter can return
   * one object and mutate it in place (`() => targetOptions`), which would rewrite
   * the parameters `dispatchToDropTarget` falls back to for that record. Resolution
   * creates a record per walked target per frame, but the React layer returns the
   * same parameters object until the target re-renders. Share its shallow copy
   * across records while its fields remain unchanged.
   */
  registrationSnapshots: WeakMap<AnyDropTargetParameters, AnyDropTargetParameters>;
}

const state = getSharedSlot<DropTargetState>('dropTarget', () => ({
  registry: new Map<Element, DropTargetGetter[]>(),
  shadowRoots: new Map<ShadowRoot, number>(),
  retainedRoots: new WeakMap<Element, ShadowRoot[]>(),
  shadowRootsByHost: new Map<Element, ShadowRoot>(),
  shadowRootChangeListeners: new Set<ShadowRootChangeListener>(),
  retiring: new Map<Element, DropTargetGetter>(),
  sessionSource: null,
  grabOffset: null,
  registrationKeys: new WeakMap<Element, WeakMap<DropTargetGetter, object>>(),
  dragData: new WeakMap<object, TargetDragData>(),
  recordRegistrations: new WeakMap<DraggableTargetRecord, RecordRegistration>(),
  registrationSnapshots: new WeakMap<AnyDropTargetParameters, AnyDropTargetParameters>(),
}));

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
 * Ref-count each shadow root a target lives in, including ancestor roots, so the
 * pointer sensor can read the set in O(1) on the pickup frame.
 *
 * `scroll` does not compose, so a scroll inside a shadow tree never reaches the
 * sensor's document-level listener. The sensor has to bind one listener per root.
 * Deriving the set at pickup would cost a `getRootNode()` walk per registered target,
 * on the frame that also builds the clone and places the preview, and the set is
 * empty in almost every app. It's a count rather than a set because one root holds many
 * targets, and only the last one to leave retires it.
 */
function retainShadowRoot(element: Element): void {
  const roots: ShadowRoot[] = [];
  let root = element.getRootNode();
  while (isShadowRoot(root)) {
    roots.push(root);
    const count = state.shadowRoots.get(root) ?? 0;
    state.shadowRoots.set(root, count + 1);
    if (count === 0) {
      if (root.mode === 'closed') {
        state.shadowRootsByHost.set(root.host, root);
      }
      for (const listener of state.shadowRootChangeListeners) {
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
    // Every root in `retained` was counted by the matching retain.
    const count = state.shadowRoots.get(root)!;
    if (count === 1) {
      state.shadowRoots.delete(root);
      state.shadowRootsByHost.delete(root.host);
      for (const listener of state.shadowRootChangeListeners) {
        listener(root, false);
      }
    } else {
      state.shadowRoots.set(root, count - 1);
    }
  }
}

/**
 * Closed shadow roots indexed by host for pointer hit-testing. The index changes
 * only when the registered root set changes, so drag frames can reuse it.
 */
export function getDropTargetShadowRootsByHost(): ReadonlyMap<Element, ShadowRoot> {
  return state.shadowRootsByHost;
}

/**
 * Run `attach` on every shadow root containing a registered drop target,
 * including ancestor roots, and on each root that joins the set later. A root's
 * cleanup runs when it leaves the set, and the returned cleanup detaches every
 * root still attached.
 */
export function trackDropTargetShadowRoots(
  attach: (shadowRoot: ShadowRoot) => DragCleanupFn | undefined,
): DragCleanupFn {
  const attached = new Map<ShadowRoot, DragCleanupFn | undefined>();
  const listener: ShadowRootChangeListener = (shadowRoot, registered) => {
    if (registered) {
      if (!attached.has(shadowRoot)) {
        attached.set(shadowRoot, attach(shadowRoot));
      }
    } else if (attached.has(shadowRoot)) {
      const cleanup = attached.get(shadowRoot);
      attached.delete(shadowRoot);
      cleanup?.();
    }
  };
  for (const shadowRoot of state.shadowRoots.keys()) {
    listener(shadowRoot, true);
  }
  state.shadowRootChangeListeners.add(listener);
  return () => {
    state.shadowRootChangeListeners.delete(listener);
    for (const cleanup of attached.values()) {
      cleanup?.();
    }
    attached.clear();
  };
}

/**
 * Keep `getParameters` readable after this element unregisters.
 *
 * Only applies while `getParameters` is the element's active hold, which means the
 * element is leaving the registry. The unregister callback also runs when a
 * non-last hold is released and another hold is promoted (see `getterStackRegistry`).
 * The element stays registered then, and any leave dispatches through the promoted hold.
 */
export function retainRetiringDropTarget(element: Element, getParameters: DropTargetGetter): void {
  if (holds.getActive(element) === getParameters) {
    state.retiring.set(element, getParameters);
  }
}

/** Open a drag session before its initial stack resolves. The lifecycle calls it on start. */
export function beginDropTargetSession(
  source: DraggableRootRecord,
  grabOffset: { x: number; y: number },
): void {
  state.sessionSource = source;
  state.grabOffset = grabOffset;
}

/**
 * Close the session by dropping every retiring hold and the drag's per-target data.
 * The lifecycle calls it on teardown. Records already handed out keep their own
 * reference to their data.
 */
export function endDropTargetSession(): void {
  state.retiring.clear();
  state.sessionSource = null;
  state.grabOffset = null;
  state.dragData = new WeakMap<object, TargetDragData>();
}

/**
 * The key a registration's payload and `dragData` are stored under.
 *
 * The getter alone can't be the key. One getter can register several elements,
 * such as cells sharing `() => cellParameters`, and each cell needs its own
 * `updatePayload()` and `updateDragData()` state. Unregistering one cell must not
 * reset the others either.
 */
function getRegistrationKey(element: Element, getParameters: DropTargetGetter): object {
  const keys = getOrCreate(state.registrationKeys, element, () => new WeakMap());
  return getOrCreate(keys, getParameters, () => ({}));
}

/**
 * Release a registration's payload and `dragData` once `element` no longer holds
 * `getParameters`, so registering the pair again starts from the declared payload.
 */
function releaseRegistrationKey(element: Element, getParameters: DropTargetGetter): void {
  if (state.registry.get(element)?.includes(getParameters)) {
    return;
  }
  const keys = state.registrationKeys.get(element);
  const key = keys?.get(getParameters);
  if (key !== undefined) {
    keys!.delete(getParameters);
    resetParticipantPayload(key);
    state.dragData.delete(key);
  }
}

/**
 * Register `element` as a drop target with a live parameters getter, pushing it
 * onto the element's stack of holds. Pass the same `getParameters` to
 * {@link removeDropTargetRegistration} so each hold releases its own getter.
 */
export function addDropTargetRegistration(element: Element, getParameters: DropTargetGetter): void {
  holds.add(element, getParameters);
}

/**
 * Drop one registration hold on `element`, removing {@link DROP_TARGET_ATTR} only
 * when the last hold is released. `beforeDelete` runs before the registry entry
 * is deleted, so a caller can refresh the lifecycle and dispatch `onDraggableLeave`
 * while the registration is still readable.
 */
export function removeDropTargetRegistration(
  element: Element,
  getParameters: DropTargetGetter,
  beforeDelete?: () => void,
): void {
  try {
    holds.remove(element, getParameters, beforeDelete);
  } finally {
    releaseRegistrationKey(element, getParameters);
  }
}

/**
 * Clear every drop-target registration so a detached target left registered by a
 * failed or aborted test can't leak into the next one. Test-only. The test
 * harness's `resetDrag()` in `test/dnd.ts` calls it.
 */
export function resetForTests(): void {
  for (const element of state.registry.keys()) {
    element.removeAttribute(DROP_TARGET_ATTR);
  }
  // Cleared in place: `holds` keeps a reference to this map.
  state.registry.clear();
  state.shadowRoots.clear();
  state.retainedRoots = new WeakMap<Element, ShadowRoot[]>();
  state.shadowRootsByHost.clear();
  state.shadowRootChangeListeners.clear();
  endDropTargetSession();
  state.recordRegistrations = new WeakMap<DraggableTargetRecord, RecordRegistration>();
  state.registrationSnapshots = new WeakMap<AnyDropTargetParameters, AnyDropTargetParameters>();
  state.registrationKeys = new WeakMap<Element, WeakMap<DropTargetGetter, object>>();
}

type ConsumerCallbackName = 'canDrop' | 'snap' | 'getParameters';

/**
 * A throwing callback costs the target its registration for this dispatch, so one
 * buggy target can't break drag resolution for every other target on the page.
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
 * The third outcome of `resolveDropTargetOutcome`. The target's `canDrop` returned
 * `'reject'`, which refuses the drop instead of abstaining. The walk turns it into
 * an empty stack.
 */
const DROP_REJECTED = Symbol('base-ui.dropTarget.rejected');

function snapshotRegistration(registration: AnyDropTargetParameters): AnyDropTargetParameters {
  return getShallowSnapshot(state.registrationSnapshots, registration, registration);
}

/** The registration's `dragData` for this drag, starting from `undefined` for a new drag or kind. */
function getTargetDragData(
  registrationKey: object,
  source: DraggableRootRecord,
  kind: symbol | undefined,
): TargetDragData {
  // Resolution can resume after its drag ended, when a consumer cancels mid-walk.
  // Don't cache the finished drag's source.
  if (source !== state.sessionSource) {
    return { source, kind, value: undefined };
  }
  let data = state.dragData.get(registrationKey);
  if (data === undefined || data.source !== source || data.kind !== kind) {
    data = { source, kind, value: undefined };
    state.dragData.set(registrationKey, data);
  }
  return data;
}

/** Apply committed payload props, including changes between drags. */
export function syncDropTargetPayload(
  element: Element | null,
  getParameters: DropTargetGetter,
  kind: symbol | undefined,
  payload: unknown,
): void {
  if (!element) {
    return;
  }
  const { changed } = syncParticipantPayload(
    getRegistrationKey(element, getParameters),
    kind,
    payload,
  );
  const source = dragSessionStore.state?.source;
  if (source && changed) {
    notifyDragTargetUpdated(source, element);
  }
}

/** Internal registration hook that captures geometry before consumers can mutate the layout. */
export const resolveCollision = Symbol.for('base-ui.resolveCollision');

export interface CollisionResolutionRegistration {
  [resolveCollision]?:
    ((target: DraggableTargetRecord, source: DraggableRootRecord) => void) | undefined;
}

/** Measure only the winning participant, immediately before dispatch can mutate its layout. */
export function captureDropTargetCollision(
  target: DraggableTargetRecord | undefined | null,
  source: DraggableRootRecord,
): void {
  if (!target) {
    return;
  }
  const registration = state.recordRegistrations.get(target)?.snapshot as
    CollisionResolutionRegistration | undefined;
  registration?.[resolveCollision]?.(target, source);
}

/**
 * Resolve one element against the active drag. Returns a `DraggableTargetRecord`
 * when the element is registered, not `disabled`, and passes both `accept` and
 * `canDrop`. Returns `null` when it abstains, and {@link DROP_REJECTED} when its
 * `canDrop` refuses the drop.
 */
function resolveDropTargetOutcome(
  element: Element,
  feedback: DropTargetFeedback,
): DraggableTargetRecord | null | typeof DROP_REJECTED {
  const getRegistration = holds.getActive(element);
  if (!getRegistration) {
    return null;
  }
  // A throwing getter is contained by the caller, `getDropTargetsOver`, which
  // treats it like an unregistered target.
  const registration = getRegistration();
  // A disabled target is not a candidate. Like a failed `canDrop`, the walk falls
  // through to ancestor targets. A getter written in plain JS can also return
  // `undefined`.
  if (registration == null || registration.disabled) {
    return null;
  }
  // Cheap kind filter first, before allocating the feedback object. This runs per
  // walked target per frame, and most targets fail here.
  const source = feedback.source;
  if (!matchesAccept(registration.accept, source)) {
    return null;
  }
  // The point readers measure lazily, so building them before `canDrop` costs
  // nothing unless it reads one. The record reuses them, so a point read here is
  // not measured again.
  const fullFeedback = { ...feedback, element } as DraggableTargetResolutionContext;
  const pointReaders = createLocalPointReaders(element, fullFeedback, registration.snap);
  Object.assign(fullFeedback, pointReaders);

  // Then `canDrop`. A throw costs only this target and doesn't abort the walk.
  const canDropVerdict = registration.canDrop
    ? safeCall('canDrop', element, () => registration.canDrop!(fullFeedback), false)
    : true;

  if (canDropVerdict === 'reject') {
    return DROP_REJECTED;
  }
  if (!canDropVerdict) {
    return null;
  }

  const kind = registration.kind?.id;
  const registrationKey = getRegistrationKey(element, getRegistration);
  const { data: payloadState } = syncParticipantPayload(
    registrationKey,
    kind,
    registration.payload,
  );
  const data = getTargetDragData(registrationKey, source, kind);
  const record: DraggableTargetRecord = {
    element,
    kind,
    get payload() {
      return payloadState.payload;
    },
    updatePayload(nextPayload) {
      if (payloadState.update(nextPayload)) {
        const activeSource = dragSessionStore.state?.source;
        notifyDragTargetUpdated(
          activeSource && holds.getActive(element) === getRegistration ? activeSource : source,
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
    ...pointReaders,
  };
  state.recordRegistrations.set(record, {
    getParameters: getRegistration,
    snapshot: snapshotRegistration(registration),
  });
  return record;
}

/**
 * Quantize one axis of a local point. Clamps to `[0, 1]`, then rounds to the
 * nearest of `steps` equal fractions. `Math.round` is symmetric around every step
 * midpoint, so drags have no directional bias. `ceil` or `floor` would shift every
 * drop one way. A missing, non-integer, or non-positive count leaves the axis
 * unquantized.
 */
function snapAxis(value: number, steps: number | undefined): number {
  const clamped = clamp(value, 0, 1);
  if (steps === undefined || !Number.isInteger(steps) || steps <= 0) {
    return clamped;
  }
  return Math.round(clamped * steps) / steps;
}

/** What resolution knows before it reaches a target: the drag and the pointer. */
type DropTargetFeedback = Pick<DraggableTargetResolutionContext, 'input' | 'source'>;

/**
 * Build the record's `getLocalPoint` and `getSnappedLocalPoint`, deferring the
 * measurement until one of them is read.
 *
 * Resolution walks the DOM from `elementFromPoint` up through the ancestors and
 * measures no rect. Computing the point eagerly would cost every drag a
 * `getBoundingClientRect()` per resolved target, only to serve the drags that read
 * it. The two readers share one measurement, and a `snap` callback runs at most once
 * per record, on the first snapped read. Layout is final by then, so a step count
 * derived at runtime (visible hours, a zoom level) is safe.
 *
 * The point is fixed at resolution but the element is not. A caller holding a
 * record past its frame gets the old pointer position against the element's current
 * rect. `payload` works the same way, resolved once and read later. The grab offset
 * is captured now because a record can outlive its drag and the session slot.
 */
function createLocalPointReaders(
  element: Element,
  context: DraggableTargetResolutionContext,
  snap: AnyDropTargetParameters['snap'],
): Pick<DraggableTargetRecord, 'getLocalPoint' | 'getSnappedLocalPoint'> {
  const { clientX, clientY } = context.input;
  const grabOffset = state.grabOffset;

  let rect: DOMRect | null = null;
  function localPoint(offsetX: number, offsetY: number): DraggableTargetLocalPoint {
    rect ??= element.getBoundingClientRect();
    // Zero on an axis with no extent, which is what an empty or detached element
    // measures as, rather than dividing by it.
    return {
      x: rect.width === 0 ? 0 : (clientX - offsetX - rect.left) / rect.width,
      y: rect.height === 0 ? 0 : (clientY - offsetY - rect.top) / rect.height,
    };
  }

  let rawMemo: DraggableTargetLocalPoint | null = null;
  const getLocalPoint = (): DraggableTargetLocalPoint => {
    rawMemo ??= localPoint(0, 0);
    return rawMemo;
  };

  let steps: DraggableTargetSnapSteps | undefined;
  let stepsResolved = false;
  function resolveSteps(): DraggableTargetSnapSteps | undefined {
    if (!stepsResolved) {
      stepsResolved = true;
      steps =
        typeof snap === 'function'
          ? safeCall('snap', element, () => snap(context), undefined)
          : snap;
    }
    return steps;
  }

  const snappedMemos: Partial<Record<'pointer' | 'source', DraggableTargetLocalPoint>> = {};
  const getSnappedLocalPoint = (
    options?: DraggableTargetSnappedLocalPointOptions,
  ): DraggableTargetLocalPoint => {
    // Documented fallback. If no session was live at resolution, there is no grab
    // offset, and `'source'` anchors on the pointer instead of failing.
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
 * Innermost first, in bubbling order.
 *
 * Uses one composed walk (`getComposedParentElement`) instead of `closest()`.
 * `closest()` follows the light-DOM parent chain straight through a shadow host,
 * so it skips a shadow-tree target that wraps the `<slot>` the node is assigned to
 * whenever a light-DOM ancestor is also a target. Entering the assigned slot before
 * climbing, and leaving through the host afterwards, visits every ancestor in the
 * order events bubble.
 *
 * A `canDrop` returning `'reject'` ends the walk with an empty stack. The rejecting
 * target refuses the drop outright, so accepting descendants are discarded and no
 * ancestor can claim the drop. A container-level rule such as a capacity limit then
 * holds without every child repeating it. `onReject` reports the rejecting element
 * so the lifecycle can set `data-rejected` on it.
 */
export function getDropTargetsOver(
  target: Element | null,
  feedback: DropTargetFeedback,
  onReject?: (element: Element) => void,
): DraggableTargetRecord[] {
  const result: DraggableTargetRecord[] = [];

  for (
    let node = target;
    node !== null;
    node = getComposedParentElement(node, state.shadowRootsByHost)
  ) {
    // Check the attribute, not the registry. While a target unregisters, its entry
    // outlives the attribute because `onLastRemove` runs before `beforeDelete`. Its
    // `onDraggableLeave` can still dispatch from the refresh, but the refreshed
    // stack must already exclude it.
    if (!node.hasAttribute(DROP_TARGET_ATTR)) {
      continue;
    }
    // The consumer callbacks are contained one by one, but the parameters they
    // come with can be malformed too, for example a non-kind `accept` from plain
    // JS. A throw here would repeat on every frame and on the release, and leave
    // the drag stuck, so it costs only this target.
    const element = node;
    const outcome = safeCall(
      'getParameters',
      element,
      () => resolveDropTargetOutcome(element, feedback),
      null,
    );
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

type DropTargetEventName = keyof DropTargetEventReasonMap & keyof DropTargetParameters;

/**
 * Deliver `eventName` to the target behind `record` through the element's active
 * registration. A target that unregistered while hovered and is still owed a leave
 * uses its retiring registration instead (see {@link DropTargetState.retiring}).
 *
 * A drop goes through the registration that resolved the record. The source's
 * `onMoveEnd` hears about the drop first and may unmount targets synchronously,
 * and the drop must still reach the target it landed on.
 *
 * `eventDetails` are the round's details as the source sees them. The target
 * receives a copy with its own record as `currentTarget`. `target` stays the round's
 * innermost target, like in a source's handlers. Every caller builds the details
 * with `location.current.targets[0]`, which is `null` only for a leave.
 */
export function dispatchToDropTarget<K extends DropTargetEventName>(
  record: DraggableTargetRecord,
  eventName: K,
  eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
): void {
  const source = eventDetails.source;
  const resolvedRegistration = state.recordRegistrations.get(record);
  const getRegistration =
    eventName === 'onDraggableDrop'
      ? resolvedRegistration?.getParameters
      : (holds.getActive(record.element) ?? state.retiring.get(record.element));
  if (!getRegistration) {
    return;
  }
  // Same containment as `getDropTargetsOver`. A throwing getter costs this
  // target its event and doesn't unwind the dispatch sequence.
  const registration = safeCall('getParameters', record.element, getRegistration, null);
  if (registration == null) {
    return;
  }
  // A leave can outlive the kind contract that produced its record.
  const compatible =
    matchesAccept(registration.accept, source) && registration.kind?.id === record.kind;
  const parameters = compatible ? registration : resolvedRegistration?.snapshot;
  if (!parameters) {
    return;
  }
  const handler = parameters[eventName] as
    ((eventDetails: DropTargetEventDetails<DropTargetEventReasonMap[K]>) => void) | undefined;
  // The round's details, with this target's own record as `currentTarget`.
  handler?.({ ...eventDetails, currentTarget: record } as DropTargetEventDetails<
    DropTargetEventReasonMap[K]
  >);
}

/** Remove the record held against `element` from the hovered bookkeeping. */
function removeHoveredRecord(hovered: DraggableTargetRecord[], element: Element): void {
  const index = hovered.findIndex((record) => record.element === element);
  if (index !== -1) {
    hovered.splice(index, 1);
  }
}

/** Swap the stale record for `fresh` (same element) in the hovered bookkeeping. */
function replaceHoveredRecord(
  hovered: DraggableTargetRecord[],
  fresh: DraggableTargetRecord,
): void {
  const index = hovered.findIndex((record) => record.element === fresh.element);
  if (index === -1) {
    hovered.push(fresh);
  } else {
    hovered[index] = fresh;
  }
}

/**
 * Swap every record in the hovered bookkeeping for its freshly resolved counterpart,
 * matched by element, without adding or removing entries. The lifecycle calls it on
 * frames where the resolved stack holds the same elements as the previous one. No
 * change dispatch runs on those frames, but the terminal `onDraggableLeave` on drop
 * or cancel reads these records. Without the swap, that leave would report the
 * `currentTarget.payload` resolved at entry while every `onDraggableMove` in between
 * reported fresh ones.
 */
export function refreshHoveredRecords(
  hovered: DraggableTargetRecord[],
  fresh: readonly DraggableTargetRecord[],
): void {
  // Runs on every element-equal move frame. Between change dispatches the hovered
  // list mirrors the resolved stack order, so the record at the same index almost
  // always matches. Scan only on a mismatch to keep the per-frame path allocation-free.
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
 * Deliver one `onDraggableLeave`. The record leaves `hovered` before the dispatch,
 * so if the leave handler cancels the drag, the terminal dispatch doesn't leave
 * this target a second time.
 *
 * The lifecycle also calls it for each terminal leave a still-hovered target is
 * owed at the end of a drag. A one-record {@link dispatchDropTargetChange} round
 * doesn't work there. It ends by resetting `hovered` to the current stack, which is
 * empty, so after the first leave the other targets would read as not hovered. A
 * leave handler that unregisters a sibling would then send it down the coalesced
 * path, which can't dispatch the leave the sibling is still owed. Here `hovered`
 * only loses the record being left, so every other target stays hovered until its
 * own leave goes out.
 */
export function dispatchDropTargetLeave(
  record: DraggableTargetRecord,
  eventDetails: DropTargetChangeEventDetails,
  hovered: DraggableTargetRecord[],
): void {
  removeHoveredRecord(hovered, record.element);
  try {
    dispatchToDropTarget(record, 'onDraggableLeave', eventDetails);
  } finally {
    // The leave its retiring hold was kept for has gone out.
    state.retiring.delete(record.element);
  }
}

/**
 * Dispatch `onDraggableLeave` to the targets that left and `onDraggableEnter` to the
 * targets that entered.
 *
 * `shouldContinue` is checked before every delivery. A handler can cancel the drag
 * re-entrantly, and the cancel already delivered the remaining targets' terminal
 * events, so they get nothing more. `hovered` is the lifecycle's hovered-stack
 * bookkeeping. It is updated as each enter and leave goes out, so an interrupted
 * dispatch leaves it listing exactly the targets that still hold hover state.
 */
export function dispatchDropTargetChange(
  previous: readonly DraggableTargetRecord[],
  current: readonly DraggableTargetRecord[],
  eventDetails: DropTargetChangeEventDetails,
  shouldContinue: () => boolean,
  hovered: DraggableTargetRecord[],
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
      dispatchDropTargetLeave(record, eventDetails, hovered);
    }
  }

  for (const record of current) {
    if (!shouldContinue()) {
      return;
    }
    if (visited.has(record.element)) {
      continue;
    }
    // Push before delivery. If the enter handler cancels the drag, the terminal
    // dispatch owes this target a matching leave.
    hovered.push(record);
    dispatchToDropTarget(record, 'onDraggableEnter', eventDetails);
  }

  // Every event went out. Sync the bookkeeping to the bubble-ordered stack.
  hovered.length = 0;
  hovered.push(...current);
}

export function dispatchToAllDropTargets<K extends DropTargetEventName>(
  targets: readonly DraggableTargetRecord[],
  eventName: K,
  eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
  shouldContinue: () => boolean,
): void {
  for (const record of targets) {
    // A handler can cancel the drag re-entrantly. The remaining targets then get
    // nothing.
    if (!shouldContinue()) {
      return;
    }
    dispatchToDropTarget(record, eventName, eventDetails);
  }
}

/**
 * Parameters accepted by `Draggable.Target` and `registerTarget`, except the element.
 *
 * `TSourcePayload` is the payload the accepted kinds carry, and `TTargetPayload` is
 * this target's own. `Draggable.Target` and `registerTarget` infer them from `accept`
 * and `payload`.
 */
export type DropTargetParameters<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = {
  /**
   * The data attached to this target, available as `eventDetails.currentTarget.payload`
   * in its handlers and on its record in `location.current.targets`.
   */
  payload?: TTargetPayload | undefined;
  /**
   * The kind of this target, created with `Draggable.createKind`. Use its `matches`
   * method to tell target kinds apart in a shared handler, which also types
   * `target.payload`. This differs from `accept`, which lists the kinds of
   * draggable this target takes.
   */
  kind?: DraggableKind<NoInfer<TTargetPayload>, TTargetDragData> | undefined;
  /**
   * One or more kinds of draggable this target accepts. Pass `Draggable.anyKind`
   * to accept every drag, with `source.payload` typed as `unknown`.
   *
   * Drags of other kinds ignore this target, but an ancestor target can still accept them.
   */
  accept?: DraggableAccept<TSourcePayload, TDragData> | undefined;
  /**
   * Whether the target ignores drags. A disabled target is skipped, so drags fall
   * through to ancestor targets.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Decides whether the current drag can be dropped on this target. Runs after `accept`.
   *
   * Return `false` to skip this target and let an ancestor receive the drop.
   * Return `'reject'` to block the drop on this target, its nested targets, and its
   * ancestors, for example when a column is full. The target then has `[data-rejected]`.
   *
   * Its argument has `getLocalPoint()`, so a target can accept the drop on part of its box only.
   */
  canDrop?:
    | ((
        parameters: DraggableTargetResolutionContext<NoInfer<TSourcePayload>, NoInfer<TDragData>>,
      ) => boolean | 'reject')
    | undefined;
  /**
   * Divides the target into equal steps for `getSnappedLocalPoint()`. For example,
   * `{ y: 96 }` splits a day column into 15-minute slots, whatever its height.
   * Accepts step counts, or a function that returns them for the current drag.
   *
   * It only changes the value this target reports. Use the `snapToGrid` modifier
   * to snap the preview itself.
   */
  snap?:
    | DraggableTargetSnapSteps
    | ((
        context: DraggableTargetResolutionContext<NoInfer<TSourcePayload>, NoInfer<TDragData>>,
      ) => DraggableTargetSnapSteps | undefined)
    | undefined;
  /**
   * Event handler called when a drag starts while this target is already under the
   * pointer. Use a monitor's `onMoveStart` to observe drags starting elsewhere.
   */
  onDraggableStart?:
    | ((
        eventDetails: DraggableTargetStartEventDetails<
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
      ) => void)
    | undefined;
  /**
   * Event handler called on every animation frame the pointer moves or a modifier key
   * changes while the drag is over this target, starting with the frame it enters.
   * Put hover feedback such as drop indicators here.
   */
  onDraggableMove?:
    | ((
        eventDetails: DraggableTargetMoveEventDetails<
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
      ) => void)
    | undefined;
  /** Event handler called when the drag moves over this target. */
  onDraggableEnter?:
    | ((
        eventDetails: DraggableTargetEnterEventDetails<
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
      ) => void)
    | undefined;
  /**
   * Event handler called when the drag moves off this target, or ends.
   * `eventDetails.reason` tells which. Cancel-specific cleanup belongs in the source's
   * or a monitor's `onMoveEnd`, whose `eventDetails.canceled` flags a cancel.
   */
  onDraggableLeave?:
    | ((
        eventDetails: DraggableTargetLeaveEventDetails<
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
      ) => void)
    | undefined;
  /**
   * Event handler called when the drag is released over this target. Only the innermost
   * target under the pointer receives it, and it never fires on a cancel.
   * Use the source's or a monitor's `onMoveEnd` to observe every drag end.
   */
  onDraggableDrop?:
    | ((
        eventDetails: DraggableTargetDropEventDetails<
          NoInfer<TSourcePayload>,
          NoInfer<TTargetPayload>,
          NoInfer<TDragData>,
          NoInfer<TTargetDragData>
        >,
      ) => void)
    | undefined;
};
