import { isShadowRoot } from '@floating-ui/utils/dom';
import { clamp } from '@base-ui/utils/clamp';
import { warn } from '@base-ui/utils/warn';
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
  DropTargetEventDetails,
  DropTargetEventReasonMap,
} from './types';
import { matchesAccept } from './dragKind';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getActiveSession } from './core/dragSession';
import {
  getComposedParentElement,
  getOrCreate,
  getShallowSnapshot,
  onceCleanup,
  safeCallConsumer,
} from './utils';
import { syncParticipantPayload } from './participantData';

/** Marks every registered drop target for the resolution walk. Internal, not a styling hook. */
const DROP_TARGET_ATTR = 'data-base-ui-drop-target';

type AnyDropTargetParameters = DropTargetParameters<any, any, any, any>;
/** Getter for a single hook's latest drop-target parameters. */
export type DropTargetGetter = () => AnyDropTargetParameters;

type ShadowRootChangeListener = (root: ShadowRoot, registered: boolean) => void;

/** A registration's `dragData`, scoped to one drag and one target kind. */
interface TargetDragData {
  kind: symbol | undefined;
  value: unknown;
}

/** One drag's `dragData` per registration. The lifecycle creates one per drag. */
export type DropTargetDragData = WeakMap<object, TargetDragData>;

/** The registration a record was resolved from. */
interface RecordRegistration {
  getParameters: DropTargetGetter;
  /** See {@link DropTargetState.registrationSnapshots}. */
  snapshot: AnyDropTargetParameters;
}

/**
 * Shared across bundle copies, since the copies that register a target, start the
 * drag and dispatch to targets can all differ.
 */
interface DropTargetState {
  /** Each registered target element's stack of parameter getters (see `getterStackRegistry`). */
  registry: Map<Element, DropTargetGetter[]>;
  /** Registered targets and draggables per shadow root (see {@link retainShadowRoots}). */
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
  /** Told when a root joins or leaves `shadowRoots` (see {@link trackRegisteredShadowRoots}). */
  shadowRootChangeListeners: Set<ShadowRootChangeListener>;
  /**
   * The key each registration's payload and `dragData` are stored under, per
   * element and getter (see {@link getRegistrationKey}).
   */
  registrationKeys: WeakMap<Element, WeakMap<DropTargetGetter, object>>;
  recordRegistrations: WeakMap<DraggableTargetRecord, RecordRegistration>;
  /**
   * A shallow copy of each parameters object a getter has returned, shared across
   * records while its fields don't change. A record can't keep the object itself:
   * a getter that mutates one object in place (`() => targetOptions`) would rewrite
   * the parameters `dispatchToDropTarget` falls back to.
   */
  registrationSnapshots: WeakMap<AnyDropTargetParameters, AnyDropTargetParameters>;
}

const state = getSharedSlot<DropTargetState>('dropTarget', () => ({
  registry: new Map<Element, DropTargetGetter[]>(),
  shadowRoots: new Map<ShadowRoot, number>(),
  retainedRoots: new WeakMap<Element, ShadowRoot[]>(),
  shadowRootsByHost: new Map<Element, ShadowRoot>(),
  shadowRootChangeListeners: new Set<ShadowRootChangeListener>(),
  registrationKeys: new WeakMap<Element, WeakMap<DropTargetGetter, object>>(),
  recordRegistrations: new WeakMap<DraggableTargetRecord, RecordRegistration>(),
  registrationSnapshots: new WeakMap<AnyDropTargetParameters, AnyDropTargetParameters>(),
}));

const holds = createGetterStackRegistry<Element, DropTargetGetter>({
  entries: state.registry,
  onFirstAdd: (element) => {
    element.setAttribute(DROP_TARGET_ATTR, '');
    state.retainedRoots.set(element, retainShadowRoots(element));
  },
  // Runs before `beforeDelete`, so the stack the caller refreshes there already
  // excludes this element.
  onLastRemove: (element) => {
    element.removeAttribute(DROP_TARGET_ATTR);
    releaseShadowRoots(state.retainedRoots.get(element) ?? []);
    state.retainedRoots.delete(element);
  },
});

/**
 * Ref-count each shadow root a target or draggable lives in, ancestor roots included,
 * so walks and the sensor read the set in O(1) instead of walking every registration.
 * Returns the roots counted, for {@link releaseShadowRoots}.
 *
 * `scroll` doesn't compose, so the sensor binds one listener per root. A count, not
 * a set, because one root holds many registrations and only the last to leave retires it.
 */
function retainShadowRoots(element: Element): ShadowRoot[] {
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
  return roots;
}

function releaseShadowRoots(retained: ShadowRoot[]): void {
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
 * Count the shadow roots a draggable lives in, so pickup walks find it through a
 * closed root's slot (see `getComposedParentElement`). Returns the release.
 */
export function holdShadowRoots(element: Element): DragCleanupFn {
  const roots = retainShadowRoots(element);
  return onceCleanup(() => releaseShadowRoots(roots));
}

/**
 * Closed shadow roots holding a registered target or draggable, indexed by host for
 * composed walks and hit-testing. The index changes only when the registered root set
 * changes, so drag frames can reuse it.
 */
export function getClosedShadowRootsByHost(): ReadonlyMap<Element, ShadowRoot> {
  return state.shadowRootsByHost;
}

/**
 * Run `attach` on every shadow root containing a registered drop target or
 * draggable, including ancestor roots, and on each root that joins the set later. A root's
 * cleanup runs when it leaves the set, and the returned cleanup detaches every
 * root still attached.
 */
export function trackRegisteredShadowRoots(
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
 * The key a registration's payload and `dragData` are stored under. Not the getter
 * alone: cells sharing `() => cellParameters` each need their own state, and
 * unregistering one must not reset the others.
 */
function getRegistrationKey(element: Element, getParameters: DropTargetGetter): object {
  const keys = getOrCreate(state.registrationKeys, element, () => new WeakMap());
  return getOrCreate(keys, getParameters, () => ({}));
}

/**
 * Drop the key once `element` no longer holds `getParameters`, so registering the
 * pair again starts from the declared payload.
 */
function releaseRegistrationKey(element: Element, getParameters: DropTargetGetter): void {
  if (!state.registry.get(element)?.includes(getParameters)) {
    state.registrationKeys.get(element)?.delete(getParameters);
  }
}

export function registerTarget<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
>(
  element: HTMLElement,
  getParameters: () => DropTargetParameters<
    TSourcePayload,
    TTargetPayload,
    TDragData,
    TTargetDragData
  >,
): DragCleanupFn {
  if (process.env.NODE_ENV !== 'production') {
    // An omitted `accept` silently takes every drag and hands foreign payloads to
    // handlers typed for its own. A throw, from the getter or a plain-JS `accept`
    // getter, is swallowed: this dev-only check must not break registration, and the
    // dispatch path already reports it.
    let missingAccept = false;
    let hasKind = false;
    try {
      const parameters = getParameters();
      // A getter written in plain JS can return `undefined`, and `accept: null`
      // takes every drag like an omitted one.
      missingAccept = parameters != null && parameters.accept == null;
      hasKind = missingAccept && Boolean(parameters.kind);
    } catch {
      // Reported on dispatch.
    }
    if (missingAccept) {
      // Only reachable from plain JS or a cast: the types require `accept`, and
      // `Draggable.Target` always passes one.
      if (hasKind) {
        warn(
          'registerTarget() was called with `kind` but no `accept`, so the target takes every drag on the page. ' +
            '`kind` is what this target is; `accept` is which sources it takes. ' +
            'Add `accept` with the kinds this target should receive, or drop `kind` if the target needs no identity of its own. ' +
            'See https://base-ui.com/react/utils/draggable.',
        );
      } else {
        warn(
          'registerTarget() was called without `accept`, so the target takes every drag on the page ' +
            'and hands foreign payloads to its handlers. ' +
            'Add `accept` with the kinds this target should receive, or ' +
            '`accept: Draggable.anyKind` to accept every drag on purpose. ' +
            'See https://base-ui.com/react/utils/draggable.',
        );
      }
    }
  }

  holds.add(element, getParameters);

  // A virtualizer can replace the hovered target's node mid-drag, so re-resolve the
  // stack to let the new node enter it. Runs on every registration: an element that
  // re-registers from its own `onDraggableLeave` keeps its entry but must still
  // rejoin the stack before the next pointer update.
  getActiveSession()?.scheduleTargetRefresh(null, true);

  return onceCleanup(() => {
    try {
      // The session can still read the registration of an element that leaves the
      // registry, to deliver a leave it is owed.
      holds.remove(element, getParameters, () => {
        getActiveSession()?.releaseTarget(element, getParameters);
      });
    } finally {
      releaseRegistrationKey(element, getParameters);
    }
  });
}

/**
 * Test-only. Clears every registration so a target a failed test left registered
 * can't leak into the next one.
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
  state.recordRegistrations = new WeakMap<DraggableTargetRecord, RecordRegistration>();
  state.registrationSnapshots = new WeakMap<AnyDropTargetParameters, AnyDropTargetParameters>();
  state.registrationKeys = new WeakMap<Element, WeakMap<DropTargetGetter, object>>();
}

type ConsumerCallbackName = 'canDrop' | 'snap' | 'getParameters';

/**
 * A throwing callback costs only its own target, for this dispatch, so one buggy
 * target can't break resolution for the rest.
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
 * `resolveDropTargetOutcome`'s result when `canDrop` returns `'reject'`, refusing
 * the drop instead of abstaining. The walk turns it into an empty stack.
 */
const DROP_REJECTED = Symbol('base-ui.dropTarget.rejected');

function snapshotRegistration(registration: AnyDropTargetParameters): AnyDropTargetParameters {
  return getShallowSnapshot(state.registrationSnapshots, registration, registration);
}

/** The registration's `dragData` for this drag, starting from `undefined` per drag and kind. */
function getTargetDragData(
  dragData: DropTargetDragData,
  registrationKey: object,
  kind: symbol | undefined,
): TargetDragData {
  let data = dragData.get(registrationKey);
  if (data === undefined || data.kind !== kind) {
    data = { kind, value: undefined };
    dragData.set(registrationKey, data);
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
  syncParticipantPayload(getRegistrationKey(element, getParameters), kind, payload);
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
 * Resolve one element against the active drag: a record when it is registered,
 * enabled, and passes `accept` and `canDrop`, {@link DROP_REJECTED} when `canDrop`
 * rejects, and `null` otherwise.
 */
function resolveDropTargetOutcome(
  element: Element,
  feedback: DropTargetFeedback,
  dragData: DropTargetDragData,
): DraggableTargetRecord | null | typeof DROP_REJECTED {
  const getRegistration = holds.getActive(element);
  if (!getRegistration) {
    return null;
  }
  // `getDropTargetsOver` contains a throwing getter.
  const registration = getRegistration();
  // Like a failed `canDrop`, a disabled target lets the walk fall through to
  // ancestors. A plain-JS getter can also return `undefined`.
  if (registration == null || registration.disabled) {
    return null;
  }
  // Cheap kind filter first: this runs per walked target per frame, and most fail here.
  const source = feedback.source;
  if (!matchesAccept(registration.accept, source)) {
    return null;
  }
  // The point readers measure lazily, and the record reuses them, so a point
  // `canDrop` reads isn't measured again.
  const fullFeedback = { ...feedback, element } as DraggableTargetResolutionContext;
  const pointReaders = createLocalPointReaders(element, fullFeedback, registration.snap);
  Object.assign(fullFeedback, pointReaders);

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
  const payloadState = syncParticipantPayload(registrationKey, kind, registration.payload);
  const data = getTargetDragData(dragData, registrationKey, kind);
  const record: DraggableTargetRecord = {
    element,
    kind,
    get payload() {
      return payloadState.payload;
    },
    updatePayload(nextPayload) {
      payloadState.update(nextPayload);
    },
    get dragData() {
      return data.value;
    },
    updateDragData(nextDragData) {
      data.value = nextDragData;
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
 * Clamp one axis to `[0, 1]` and round it to the nearest of `steps` equal fractions.
 * `Math.round`, not `floor` or `ceil`, so drops have no directional bias. A missing,
 * non-integer or non-positive `steps` only clamps.
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
 * Builds the record's local-point readers. They share one `getBoundingClientRect()`, taken
 * on the first read rather than per resolved target per frame, and `snap` runs at most once.
 * The pointer is fixed at resolution but the rect isn't, so a record read after its frame
 * pairs the old pointer with the current rect. The grab offset is captured now because a
 * record can outlive its drag.
 */
function createLocalPointReaders(
  element: Element,
  context: DraggableTargetResolutionContext,
  snap: AnyDropTargetParameters['snap'],
): Pick<DraggableTargetRecord, 'getLocalPoint' | 'getSnappedLocalPoint'> {
  const { clientX, clientY } = context.input;
  const grabOffset = getActiveSession()?.grabOffset ?? null;

  let rect: DOMRect | null = null;
  function localPoint(offsetX: number, offsetY: number): DraggableTargetLocalPoint {
    rect ??= element.getBoundingClientRect();
    // Zero on an axis with no extent (an empty or detached element) instead of
    // dividing by zero.
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
    // Documented fallback: with no session at resolution there is no grab offset,
    // so `'source'` anchors on the pointer.
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
 * Collects the registered, enabled drop targets from `target` up the composed tree whose
 * `accept` and `canDrop` pass, innermost first. Not `closest()`, which skips a shadow-tree
 * target wrapping the `<slot>` the node is assigned to. A `canDrop` returning `'reject'`
 * empties the stack and reports the element to `onReject`, so a container rule such as a
 * capacity limit holds without every child repeating it.
 */
export function getDropTargetsOver(
  target: Element | null,
  feedback: DropTargetFeedback,
  dragData: DropTargetDragData,
  onReject?: (element: Element) => void,
): DraggableTargetRecord[] {
  const result: DraggableTargetRecord[] = [];

  for (
    let node = target;
    node !== null;
    node = getComposedParentElement(node, state.shadowRootsByHost)
  ) {
    // Check the attribute, not the registry. An unregistering target loses the
    // attribute first, so the refresh that delivers its leave already excludes it.
    if (!node.hasAttribute(DROP_TARGET_ATTR)) {
      continue;
    }
    // Malformed parameters, such as a non-kind `accept` from plain JS, can throw
    // too. Uncontained, that would repeat every frame and leave the drag stuck.
    const element = node;
    const outcome = safeCall(
      'getParameters',
      element,
      () => resolveDropTargetOutcome(element, feedback, dragData),
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

export type DropTargetEventName = keyof DropTargetEventReasonMap & keyof DropTargetParameters;

/**
 * Delivers `eventName` through the element's active registration, or through `fallback`
 * (the hover ledger's retained one) once it has unregistered. A drop uses the registration
 * that resolved the record, since the source's `onMoveEnd` runs first and may unmount the
 * target. The handler gets its own record as `currentTarget`; `target` stays the innermost.
 */
export function dispatchToDropTarget<K extends DropTargetEventName>(
  record: DraggableTargetRecord,
  eventName: K,
  eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
  fallback?: DropTargetGetter,
): void {
  const source = eventDetails.source;
  const resolvedRegistration = state.recordRegistrations.get(record);
  const getRegistration =
    eventName === 'onDraggableDrop'
      ? resolvedRegistration?.getParameters
      : (holds.getActive(record.element) ?? fallback);
  if (!getRegistration) {
    return;
  }
  // A throwing getter costs this target its event without unwinding the dispatch.
  const registration = safeCall('getParameters', record.element, getRegistration, null);
  if (registration == null) {
    return;
  }
  // A leave can outlive the `accept` or `kind` that produced its record. It then
  // goes through the record's snapshot.
  const compatible =
    matchesAccept(registration.accept, source) && registration.kind?.id === record.kind;
  const parameters = compatible ? registration : resolvedRegistration?.snapshot;
  if (!parameters) {
    return;
  }
  const handler = parameters[eventName] as
    ((eventDetails: DropTargetEventDetails<DropTargetEventReasonMap[K]>) => void) | undefined;
  handler?.({ ...eventDetails, currentTarget: record } as DropTargetEventDetails<
    DropTargetEventReasonMap[K]
  >);
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
