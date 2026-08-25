import { isShadowRoot } from '@floating-ui/utils/dom';
import { clamp } from '@base-ui/utils/clamp';
import type {
  DragAccept,
  DragKind,
  DragLocalPoint,
  DragSnappedLocalPointOptions,
  DragSnapSteps,
  DropEvent,
  DropTargetEvent,
  DropTargetResolutionContext,
  DropTargetSelf,
  DropTargetRecord,
  DragSource,
  DragEventDetailsMap,
  DragEventMap,
} from '../../types/drag';
import { matchesAccept } from './dragKind';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, getShadowHost, safeCallConsumer } from './utils';

/** Attribute the engine sets on a registered drop target element. */
const DROP_TARGET_ATTR = 'data-drop-target';
const DROP_TARGET_SELECTOR = `[${DROP_TARGET_ATTR}]`;

/** Getter for a single hook's latest drop-target parameters. */
type DropTargetGetter = () => RegisterDropTargetParameters<any, any>;

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
   * The shadow root each registered element was counted against, so the release
   * decrements what the retain incremented even if the node has since moved.
   */
  retainedRoots: WeakMap<Element, ShadowRoot>;
}

const state = getSharedSlot<DropTargetState>('dropTarget', () => ({
  registry: new Map<Element, DropTargetGetter[]>(),
  shadowRoots: new Map<ShadowRoot, number>(),
  retainedRoots: new WeakMap<Element, ShadowRoot>(),
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
  const root = element.getRootNode();
  // Realm-safe: a target inside an iframe has its own `ShadowRoot` constructor.
  if (isShadowRoot(root)) {
    state.shadowRoots.set(root, (state.shadowRoots.get(root) ?? 0) + 1);
    // Remembered rather than re-derived on release: `getRootNode()` answers for
    // where the element is *now*, and a node moved (or detached) while registered
    // would release a root it never retained — leaking this one, and decrementing
    // the other below its true count until it is dropped while it still holds
    // targets, silently costing it its `scroll` listener mid-drag.
    state.retainedRoots.set(element, root);
  }
}

function releaseShadowRoot(element: Element): void {
  const root = state.retainedRoots.get(element);
  if (root === undefined) {
    return;
  }
  state.retainedRoots.delete(element);
  const count = state.shadowRoots.get(root);
  if (count === undefined) {
    return;
  }
  if (count <= 1) {
    state.shadowRoots.delete(root);
  } else {
    state.shadowRoots.set(root, count - 1);
  }
}

/**
 * Every shadow root that currently holds a registered drop target. The pointer
 * sensor binds a capture-phase `scroll` listener to each at pickup.
 */
export function getDropTargetShadowRoots(): Iterable<ShadowRoot> {
  return state.shadowRoots.keys();
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
 * `onDragLeave` they are owed has gone out.
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

/** Hold `getParameters` readable across this element's unregistration. */
export function retainRetiringDropTarget(element: Element, getParameters: DropTargetGetter): void {
  retiringRegistrations.set(element, getParameters);
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

/**
 * Drop one registration hold on `element`, removing {@link DROP_TARGET_ATTR} only
 * when the last hold is released. Returns `true` when it removed the target
 * entirely. `beforeDelete` runs before the registry entry is deleted, so a caller
 * can refresh the lifecycle while the registration is still readable, for the
 * `onDragLeave` dispatch.
 */
export function removeDropTargetRegistration(
  element: Element,
  getParameters: DropTargetGetter,
  beforeDelete?: () => void,
): boolean {
  return holds.remove(element, getParameters, beforeDelete);
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
  retiringRegistrations.clear();
}

type ConsumerCallbackName = 'canDrop' | 'getPayload' | 'snap' | 'getParameters';

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
 * Sentinel `safeCall` fallback for `getPayload`, distinguishing a value the
 * callback genuinely returned from a thrown failure: no return value can be
 * mistaken for it.
 */
const PAYLOAD_ERROR = Symbol('payloadError');

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
 * The payload a target declared, when it declared a plain value rather than a
 * resolver; `undefined` otherwise, including for an unregistered element.
 *
 * A peek, not a resolution: it runs the parameters getter but never `accept`,
 * `canDrop`, or a `getPayload` callback, so it costs nothing a caller wasn't going
 * to pay and can't have side effects. Resolved payloads deliberately return
 * `undefined` — evaluating one needs a resolution context, and its answer can
 * differ per point, so a caller must not assume a peeked value stands for every
 * position on the target.
 */
export function getDeclaredDropTargetPayload(element: Element): unknown {
  const getRegistration = getActiveRegistration(element);
  if (!getRegistration) {
    return undefined;
  }
  const registration = safeCall('getParameters', element, getRegistration, null);
  return registration?.getPayload ? undefined : registration?.payload;
}

/**
 * `resolveDropTargetOutcome`'s third answer: the target's `canDrop` returned
 * `'reject'`, refusing the drop outright rather than abstaining. Internal: the
 * walk turns it into an empty stack.
 */
const DROP_REJECTED = Symbol('base-ui.dropTarget.rejected');

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
  // The getter is consumer-supplied through the public imperative API, and this
  // resolution path runs outside the lifecycle's recovery try (`start()` resolves
  // the initial stack before any error boundary is armed). An uncontained throw
  // there would strand `state.isActive` and permanently refuse every future
  // pickup, so treat a throwing getter like an unregistered target instead.
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

  // A value payload can't throw, so only the resolver needs the boundary.
  const payload = registration.getPayload
    ? safeCall('getPayload', element, () => registration.getPayload!(fullFeedback), PAYLOAD_ERROR)
    : registration.payload;
  // A throwing `getPayload` yields the sentinel: treat the target as inactive, like
  // `canDrop: false`, instead of dispatching `onDrop` with a stand-in cast as the
  // declared payload type.
  if (payload === PAYLOAD_ERROR) {
    return null;
  }
  return {
    element,
    kind: registration.kind?.id,
    payload,
    ...createLocalPointReaders(element, fullFeedback, registration.snap),
  };
}

/**
 * Quantize one axis of a local point: clamp to `0`–`1`, then round to the nearest
 * of `steps` equal fractions. `Math.round`, deliberately: it is symmetric around
 * every step midpoint, so drags carry no directional bias, where a `ceil` or
 * `floor` would shift every drop one way.
 * A missing or non-positive count leaves the axis unquantized (still clamped).
 */
function snapAxis(value: number, steps: number | undefined): number {
  const clamped = clamp(value, 0, 1);
  if (steps === undefined || !Number.isFinite(steps) || steps <= 0) {
    return clamped;
  }
  return Math.round(clamped * steps) / steps;
}

/**
 * Build the record's `getLocalPoint` and `getSnappedLocalPoint`, deferring the
 * measurement until something asks.
 *
 * Resolution here is a DOM walk — `elementFromPoint` then `closest` — so no rect is
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
  snap: RegisterDropTargetParameters<any, any>['snap'],
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
 * Walk up the DOM from `target` and collect every registered, non-disabled
 * drop target whose `accept` and `canDrop` both pass. Crosses shadow-DOM
 * boundaries via `host.parentElement`. Bubble-ordered, innermost first.
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
  let current = target;

  while (current) {
    // `closest()` doesn't cross shadow boundaries; climb out via the shadow host
    // so ancestor targets in the light DOM (or an outer shadow tree) are collected.
    const found = current.closest(DROP_TARGET_SELECTOR);
    if (found) {
      const outcome = resolveDropTargetOutcome(found, feedback);
      if (outcome === DROP_REJECTED) {
        result.length = 0;
        onReject?.(found);
        return result;
      }
      if (outcome) {
        result.push(outcome);
      }
      current = getComposedParentElement(found);
    } else {
      current = getShadowHost(current);
    }
  }

  return result;
}

// `onDragEnd` is source/monitor only, so it is excluded from the indexable key set.
type DropTargetEventName = keyof DragEventMap & keyof RegisterDropTargetParameters;

/**
 * Pre-capture the active registration getter for a record so a later dispatch
 * survives the target unregistering in between. Used by the drop path: the
 * source's `onDragEnd` (told the drop landed first) may synchronously tear
 * down its zones, and the drop it was just told about must still be delivered.
 */
export function captureDropTargetRegistration(
  record: DropTargetRecord,
): (() => RegisterDropTargetParameters<any, any>) | undefined {
  return getActiveRegistration(record.element);
}

export function dispatchToDropTarget<K extends DropTargetEventName>(
  record: DropTargetRecord,
  eventName: K,
  payload: DragEventMap[K],
  eventDetails: DragEventDetailsMap[K],
  capturedRegistration?: () => RegisterDropTargetParameters<any, any>,
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
  const handler = registration[eventName] as
    | ((parameters: DragEventMap[K] & DropTargetSelf, eventDetails: DragEventDetailsMap[K]) => void)
    | undefined;
  handler?.({ ...payload, self: record }, eventDetails);
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
 * dispatch runs there, yet the terminal `onDragLeave` on drop or cancel reads these
 * records — without the swap it would report the `self.payload` resolved at entry
 * time while every intermediate `onDrag` reported fresh ones.
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
 * Dispatch `onDropTargetChange` to every previous and current target, plus
 * `onDragLeave` for targets that left and `onDragEnter` for targets that entered.
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
  payload: DragEventMap['onDropTargetChange'],
  eventDetails: DragEventDetailsMap['onDropTargetChange'],
  shouldContinue?: (() => boolean) | undefined,
  hovered?: DropTargetRecord[] | undefined,
): void {
  const live = () => shouldContinue === undefined || shouldContinue();
  const currByElement = new Map(current.map((r) => [r.element, r] as const));
  const visited = new Set<Element>();

  for (const record of previous) {
    if (!live()) {
      return;
    }
    visited.add(record.element);
    // For a persisting target, dispatch the fresh record so `self.payload` reflects this frame.
    const fresh = currByElement.get(record.element);
    if (fresh) {
      if (hovered) {
        replaceHoveredRecord(hovered, fresh);
      }
      dispatchToDropTarget(fresh, 'onDropTargetChange', payload, eventDetails);
    } else {
      dispatchToDropTarget(record, 'onDropTargetChange', payload, eventDetails);
      if (!live()) {
        return;
      }
      // Removed before the leave is delivered: if the leave handler cancels the
      // drag, the terminal dispatch must not re-leave this target.
      if (hovered) {
        removeHoveredRecord(hovered, record.element);
      }
      dispatchToDropTarget(record, 'onDragLeave', payload, eventDetails);
      // The leave this element was owed has now gone out, so a retiring hold kept
      // for it has done its job.
      releaseRetiringDropTarget(record.element);
    }
  }

  for (const record of current) {
    if (!live()) {
      return;
    }
    if (visited.has(record.element)) {
      continue;
    }
    // Added before delivery: if the enter (or its change) handler cancels the
    // drag, the terminal dispatch owes this target a balancing leave.
    if (hovered) {
      hovered.push(record);
    }
    dispatchToDropTarget(record, 'onDropTargetChange', payload, eventDetails);
    if (!live()) {
      return;
    }
    dispatchToDropTarget(record, 'onDragEnter', payload, eventDetails);
  }

  // Fully delivered: sync the bookkeeping to the canonical, bubble-ordered stack.
  if (hovered) {
    hovered.length = 0;
    hovered.push(...current);
  }
}

export function dispatchToAllDropTargets<K extends DropTargetEventName>(
  targets: readonly DropTargetRecord[],
  eventName: K,
  payload: DragEventMap[K],
  eventDetails: DragEventDetailsMap[K],
  shouldContinue?: (() => boolean) | undefined,
): void {
  for (const record of targets) {
    // A handler can cancel the drag re-entrantly; the remaining targets must then
    // receive nothing.
    if (shouldContinue !== undefined && !shouldContinue()) {
      return;
    }
    dispatchToDropTarget(record, eventName, payload, eventDetails);
  }
}

/**
 * Parameters accepted by `DropTarget.Root` and `registerDropTarget`, except the element.
 *
 * `TSourceData` is the payload the accepted kinds carry and `TLocalData` this target's
 * own. `DropTarget.Root` and `registerDropTarget` infer both, from `accept` and
 * `payload` respectively.
 */
export type RegisterDropTargetParameters<TSourceData = unknown, TLocalData = unknown> = {
  /**
   * The data to attach to this target, read back as `self.payload` in its own
   * callbacks and on its record in `location.dropTargets`. Use it to identify which
   * cell, row, or column a drag is over. Functions are preserved as ordinary
   * payload values.
   */
  payload?: TLocalData | undefined;
  /**
   * Resolves this target's payload each time it is evaluated. Use this instead
   * of `payload` when the value depends on the current drag or position.
   */
  getPayload?:
    ((context: DropTargetResolutionContext<NoInfer<TSourceData>>) => TLocalData) | undefined;
  /**
   * The target kind created with `Draggable.createKind`. It is available as
   * `self.kind` and on entries in `location.dropTargets`. Use the kind's `matches`
   * method to distinguish target kinds and narrow their payload types. Its payload
   * type must match this target's `payload`.
   *
   * Distinct from `accept`, which declares the **source** kinds this target takes.
   */
  kind?: DragKind<NoInfer<TLocalData>> | undefined;
  /**
   * One or more drag source kinds accepted by this target.
   *
   * Every registration uses the same page-wide drag manager, so this value is
   * required. Pass `DropTarget.anyKind` to accept every drag. In that case,
   * `source.payload` is `unknown`.
   *
   * The target ignores a source whose kind is not accepted. An ancestor target can
   * still accept it. Base UI checks `accept` before `canDrop`.
   */
  accept?: DragAccept<TSourceData> | undefined;
  /**
   * Whether the drop target should ignore user interaction. A disabled target is
   * skipped by target resolution as if it weren't registered, so drags fall through
   * to ancestor targets. A hovered target disabled mid-drag leaves the active stack,
   * with its `onDragLeave`, on the next resolution.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Predicate for whether this target should be considered a candidate for the
   * current drag. Runs after `accept`.
   *
   * Return `false` to skip this target for the current resolution. Base UI continues
   * through its ancestors, so a parent target can receive the drop. This differs from
   * ignoring the drop inside `onDrop`, which does not give a parent target a chance.
   *
   * Return `'reject'` to block every drop at this position. Descendants, this target,
   * and ancestors cannot receive the drop. While the drag is over the target, it has
   * `data-rejected`. Use this for container rules such as a capacity limit. Returning
   * `false` would allow an item inside the container to receive the drop.
   */
  canDrop?:
    | ((parameters: DropTargetResolutionContext<NoInfer<TSourceData>>) => boolean | 'reject')
    | undefined;
  /**
   * Divides the target's border box into equal steps for
   * `getSnappedLocalPoint()`. For example, `{ y: 96 }` creates 15-minute slots in
   * a day column, and `{ x: 7, y: 6 }` creates a month grid.
   *
   * Step counts do not depend on the target's pixel size. Base UI measures the
   * target when resolving a drag. Pass a static value or a callback that receives
   * the same context as `canDrop`. The callback runs on the first snapped read for
   * each resolution. Return `undefined` to skip snapping.
   *
   * This differs from `snapToGrid`, which snaps the drag position for every target.
   * `snap` changes only the value reported by this target.
   */
  snap?:
    | DragSnapSteps
    | ((context: DropTargetResolutionContext<NoInfer<TSourceData>>) => DragSnapSteps | undefined)
    | undefined;
  /**
   * Event handler called when a matching drag starts while this target is already
   * under the pointer. It does not fire for drags that start elsewhere; use a
   * monitor's `onDragStart` to observe every drag.
   */
  onDragStart?:
    | ((
        parameters: DropTargetEvent<'onDragStart', NoInfer<TSourceData>, NoInfer<TLocalData>>,
        eventDetails: DragEventDetailsMap['onDragStart'],
      ) => void)
    | undefined;
  /**
   * Event handler called on the frame this target enters the active stack, right
   * after `onDragEnter`, and on every rAF tick the pointer moves while the target
   * remains in the stack. Put hover-tracking work here and use `onDragEnter` for
   * enter-only side effects.
   */
  onDrag?:
    | ((
        parameters: DropTargetEvent<'onDrag', NoInfer<TSourceData>, NoInfer<TLocalData>>,
        eventDetails: DragEventDetailsMap['onDrag'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the active drop targets change, including changes that
   * don't affect this target's own membership, such as a nested descendant entering
   * or leaving while this ancestor stays in the stack. Use `onDragEnter` and
   * `onDragLeave` for this target's own enter and leave.
   */
  onDropTargetChange?:
    | ((
        parameters: DropTargetEvent<
          'onDropTargetChange',
          NoInfer<TSourceData>,
          NoInfer<TLocalData>
        >,
        eventDetails: DragEventDetailsMap['onDropTargetChange'],
      ) => void)
    | undefined;
  /** Event handler called when this target enters the active stack. */
  onDragEnter?:
    | ((
        parameters: DropTargetEvent<'onDragEnter', NoInfer<TSourceData>, NoInfer<TLocalData>>,
        eventDetails: DragEventDetailsMap['onDragEnter'],
      ) => void)
    | undefined;
  /**
   * Event handler called when this target leaves the active stack, because the
   * pointer moved away or the drag ended. `eventDetails.reason` identifies whether
   * the pointer left the target, or the drag ended.
   */
  onDragLeave?:
    | ((
        parameters: DropTargetEvent<'onDragLeave', NoInfer<TSourceData>, NoInfer<TLocalData>>,
        eventDetails: DragEventDetailsMap['onDragLeave'],
      ) => void)
    | undefined;
  /**
   * Event handler called on the innermost active drop target only, when the user
   * releases the drag over it. Ancestor targets in the same stack do not receive
   * `onDrop`, and it never fires on a cancel. To observe every drag end regardless of
   * target depth or cancellation, use the source's or a monitor's `onDragEnd`.
   */
  onDrop?:
    | ((
        parameters: DropEvent<NoInfer<TSourceData>, NoInfer<TLocalData>>,
        eventDetails: DragEventDetailsMap['onDrop'],
      ) => void)
    | undefined;
};
