import { matchesAccept } from './dragKind';
import type { DraggableAccept } from '../../draggable/DraggableProvider';
import type {
  DraggableRootRecord,
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEndValue,
  DraggableRootMoveEventDetails,
  DraggableRootMoveStartEventDetails,
  DraggableRootMoveStartValue,
  DraggableRootMoveValue,
  DraggableRootTargetChangeEventDetails,
  DraggableRootTargetChangeValue,
} from '../../draggable/root/DraggableRoot';
import type { DragSourceEventValue, DraggableEventDetailsMap } from './types';
import { getSharedSlot } from './sharedState';
import { containConsumerError } from './utils';

/** A getter for a monitor's latest parameters, read fresh on each dispatch. */
type MonitorGetter<TSourcePayload = any, TDragData = any> = () => RegisterMonitorParameters<
  TSourcePayload,
  TDragData
>;

interface MatchedMonitor {
  /** The parameters object the getter returned, to tell a fresh one from the last. */
  parameters: RegisterMonitorParameters;
  /** Its copy, so a getter that mutates one object in place can't rewrite the closure. */
  snapshot: RegisterMonitorParameters;
}

interface MonitorState {
  allMonitors: Set<MonitorGetter>;
  /** Monitor getters observing the current drag (their `accept` matched). */
  activeMonitors: Set<MonitorGetter>;
  /** The active drag's source, so a monitor registered mid-drag can join it. */
  activeSource: DraggableRootRecord | null;
  /**
   * The last `accept`-compatible parameters per engaged monitor, kept so a monitor
   * whose `accept` stops matching mid-drag can still close its observation. Copied
   * only when the getter returns a new object: this is read per monitor per event.
   */
  matchedMonitors: WeakMap<MonitorGetter, MatchedMonitor>;
}

const state = getSharedSlot<MonitorState>('registerMonitor', () => ({
  allMonitors: new Set<MonitorGetter>(),
  activeMonitors: new Set<MonitorGetter>(),
  activeSource: null,
  matchedMonitors: new WeakMap<MonitorGetter, MatchedMonitor>(),
}));

function rememberMatchedMonitor(getMonitor: MonitorGetter, parameters: RegisterMonitorParameters) {
  const matched = state.matchedMonitors.get(getMonitor);
  if (matched === undefined || matched.parameters !== parameters) {
    state.matchedMonitors.set(getMonitor, { parameters, snapshot: { ...parameters } });
  }
}

/** The monitor registry: a getter per monitor for its latest parameters. */
export const monitorRegistry = state.allMonitors;

/**
 * Evaluate a just-registered monitor against an in-progress drag so it observes
 * the remainder of the active drag (e.g. a scroll container mounting mid-drag).
 * `onMoveStart` has already fired, so it only receives subsequent events. No-op
 * when no drag is active or the monitor is already engaged.
 */
function engageMonitorIfDragging(getMonitor: MonitorGetter): void {
  const activeSource = state.activeSource;
  // Skip monitors already engaged for this drag so the activation loop and the
  // mid-drag registration path can't add the same getter twice.
  if (!activeSource || state.activeMonitors.has(getMonitor)) {
    return;
  }
  // Contained like `dispatchToMonitors`: this getter is consumer code, and it
  // runs from `start()` (aborting the drag for everyone) and from a layout effect
  // mid-drag (propagating out of React's commit). A monitor whose getter throws
  // simply sits this drag out.
  const monitor = containConsumerError(
    "Base UI: a drag monitor's parameters getter threw, so the monitor was skipped for this drag.",
    null,
    getMonitor,
    null,
  );
  // The getter may have ended the drag, or ended it and started another: only
  // engage the monitor for the drag it was evaluated against.
  if (
    monitor !== null &&
    state.activeSource === activeSource &&
    matchesAccept(monitor.accept, activeSource)
  ) {
    state.activeMonitors.add(getMonitor);
    rememberMatchedMonitor(getMonitor, monitor);
  }
}

/** Register a monitor getter. One registered mid-drag joins the drag for its remainder. */
export function addMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.add(getMonitor);
  engageMonitorIfDragging(getMonitor);
}

/** Remove a monitor getter from both the registry and the active set. */
export function removeMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.delete(getMonitor);
  state.activeMonitors.delete(getMonitor);
  state.matchedMonitors.delete(getMonitor);
}

export function activateMonitors(source: DraggableRootRecord): void {
  // Remember the source before the loop: `engageMonitorIfDragging` reads it,
  // and it is also what lets a monitor registered mid-drag be matched against
  // the in-progress drag.
  state.activeSource = source;
  for (const getMonitor of state.allMonitors) {
    engageMonitorIfDragging(getMonitor);
  }
}

export function dispatchToMonitors<
  K extends keyof DraggableEventDetailsMap & keyof RegisterMonitorParameters,
>(eventName: K, value: DragSourceEventValue, eventDetails: DraggableEventDetailsMap[K]): void {
  if (state.activeMonitors.size === 0) {
    return;
  }

  // Snapshot so a monitor engaging mid-dispatch doesn't receive the in-flight
  // event; the `has` re-check skips monitors a handler removed under us.
  for (const getMonitor of [...state.activeMonitors]) {
    if (!state.activeMonitors.has(getMonitor)) {
      continue;
    }
    // Contained per monitor, like each drop target's dispatch: a monitor is an
    // observer, and one broken observer must not starve the rest of them or
    // unwind the dispatch sequence that is mid-flight.
    containConsumerError(
      'Base UI: a drag monitor threw and was skipped for this event.',
      null,
      () => {
        let monitor = getMonitor();
        if (matchesAccept(monitor.accept, value.source)) {
          rememberMatchedMonitor(getMonitor, monitor);
        } else {
          // Finish the observer that joined this drag, using its compatible closure.
          // Other events must not reach the newly configured observer.
          if (eventName !== 'onMoveEnd') {
            return;
          }
          const previous = state.matchedMonitors.get(getMonitor);
          if (!previous) {
            return;
          }
          monitor = previous.snapshot;
        }
        const handler = monitor[eventName] as
          ((value: DragSourceEventValue, details: DraggableEventDetailsMap[K]) => void) | undefined;
        handler?.(value, eventDetails);
      },
      undefined,
    );
  }
}

export function clearActiveMonitors(): void {
  state.activeMonitors.clear();
  state.activeSource = null;
}

export interface RegisterMonitorParameters<TSourcePayload = unknown, TDragData = unknown> {
  /**
   * One or more kinds of draggable to observe. Omit it to observe every drag,
   * with `source.payload` typed as `unknown`.
   *
   * Evaluated when a drag starts, or when the monitor registers during a drag.
   * A drag it excludes is ignored until it ends.
   */
  accept?: DraggableAccept<TSourcePayload, TDragData> | undefined;
  /**
   * Event handler called once when a matching drag starts, wherever it started.
   * A monitor registered during a drag doesn't receive it for that drag.
   */
  onMoveStart?:
    | ((
        value: DraggableRootMoveStartValue<TSourcePayload, TDragData>,
        eventDetails: DraggableRootMoveStartEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called as the pointer moves or a modifier key changes,
   * at most once per animation frame.
   */
  onMove?:
    | ((
        value: DraggableRootMoveValue<TSourcePayload, TDragData>,
        eventDetails: DraggableRootMoveEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when the drop targets under the pointer change.
   */
  onTargetChange?:
    | ((
        value: DraggableRootTargetChangeValue<TSourcePayload, TDragData>,
        eventDetails: DraggableRootTargetChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends, after a drop, a release outside any
   * target, or a cancellation. `target` is the target that received the drop, or `null`.
   * `eventDetails.canceled` tells a cancel from a release, and `eventDetails.reason` says
   * exactly why the drag ended.
   *
   * It can fire without a preceding `onMoveStart`, for example when the monitor
   * registered during the drag, so don't assume the two are paired.
   */
  onMoveEnd?:
    | ((
        value: DraggableRootMoveEndValue<TSourcePayload, TDragData>,
        eventDetails: DraggableRootMoveEndEventDetails,
      ) => void)
    | undefined;
}
