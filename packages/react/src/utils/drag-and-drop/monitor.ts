import { matchesAccept } from './dragKind';
import type { DraggableAccept } from '../../draggable/DraggableProvider';
import type {
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEventDetails,
  DraggableRootMoveStartEventDetails,
  DraggableRootTargetChangeEventDetails,
} from '../../draggable/root/DraggableRoot';
import type { DraggableEventDetailsMap } from './types';
import { getSharedSlot } from './sharedState';
import { getActiveSession } from './core/dragSession';
import { containConsumerError, getShallowSnapshot } from './utils';

/** Returns a monitor's latest parameters. Read on each dispatch. */
type MonitorGetter = () => MonitorParameters<any, any>;

interface MonitorState {
  allMonitors: Set<MonitorGetter>;
  /** The monitors engaged in the current drag. */
  activeMonitors: Set<MonitorGetter>;
  /**
   * Each engaged monitor's last parameters whose `accept` matched, so a monitor
   * whose `accept` stops matching mid-drag still gets `onMoveEnd`. Shallow copies,
   * so a getter that mutates one object in place can't change them.
   */
  matchedMonitors: WeakMap<MonitorGetter, MonitorParameters>;
}

const state = getSharedSlot<MonitorState>('registerMonitor', () => ({
  allMonitors: new Set<MonitorGetter>(),
  activeMonitors: new Set<MonitorGetter>(),
  matchedMonitors: new WeakMap<MonitorGetter, MonitorParameters>(),
}));

/** Keep a copy of the monitor's parameters for a later `onMoveEnd` (see `matchedMonitors`). */
function rememberMatchedMonitor(getMonitor: MonitorGetter, parameters: MonitorParameters): void {
  getShallowSnapshot(state.matchedMonitors, getMonitor, parameters);
}

/**
 * Engages a monitor in the active drag when its `accept` matches the source. Runs
 * for every monitor at drag start, and for one that registers mid-drag, which
 * misses `onMoveStart`.
 */
function engageMonitorIfDragging(getMonitor: MonitorGetter): void {
  const session = getActiveSession();
  // Both the activation loop and a mid-drag registration can reach one getter.
  if (!session || state.activeMonitors.has(getMonitor)) {
    return;
  }
  // The getter is consumer code. Uncontained, a throw would abort `start()` for
  // everyone or escape React's commit mid-drag. A throwing monitor skips this drag.
  const monitor = containConsumerError(
    "Base UI: a drag monitor's parameters getter threw, so the monitor was skipped for this drag.",
    null,
    getMonitor,
    null,
  );
  // The getter may have ended the drag or started another. Engage only in the drag
  // it was evaluated against. A plain-JS getter can also return `undefined`.
  if (
    monitor != null &&
    getActiveSession() === session &&
    matchesAccept(monitor.accept, session.source)
  ) {
    state.activeMonitors.add(getMonitor);
    rememberMatchedMonitor(getMonitor, monitor);
  }
}

/** A monitor registered mid-drag joins the rest of that drag. */
export function addMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.add(getMonitor);
  engageMonitorIfDragging(getMonitor);
}

export function removeMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.delete(getMonitor);
  state.activeMonitors.delete(getMonitor);
  state.matchedMonitors.delete(getMonitor);
}

/** Engage every registered monitor in the session that just started. */
export function activateMonitors(): void {
  for (const getMonitor of state.allMonitors) {
    engageMonitorIfDragging(getMonitor);
  }
}

export function dispatchToMonitors<
  K extends keyof DraggableEventDetailsMap & keyof MonitorParameters,
>(eventName: K, eventDetails: DraggableEventDetailsMap[K]): void {
  if (state.activeMonitors.size === 0) {
    return;
  }

  // Iterate a copy, so a monitor that engages mid-dispatch doesn't receive the
  // current event. The `has` check skips monitors a handler removed meanwhile.
  for (const getMonitor of [...state.activeMonitors]) {
    if (!state.activeMonitors.has(getMonitor)) {
      continue;
    }
    // One throwing monitor must not stop the others or unwind the dispatch.
    containConsumerError(
      'Base UI: a drag monitor threw and was skipped for this event.',
      null,
      () => {
        let monitor = getMonitor();
        if (matchesAccept(monitor.accept, eventDetails.source)) {
          rememberMatchedMonitor(getMonitor, monitor);
        } else {
          // `accept` no longer matches. Deliver only `onMoveEnd`, through the last
          // matching parameters, so the monitor can close the drag it joined.
          if (eventName !== 'onMoveEnd') {
            return;
          }
          const previous = state.matchedMonitors.get(getMonitor);
          if (!previous) {
            return;
          }
          monitor = previous;
        }
        const handler = monitor[eventName] as
          ((eventDetails: DraggableEventDetailsMap[K]) => void) | undefined;
        handler?.(eventDetails);
      },
      undefined,
    );
  }
}

export function clearActiveMonitors(): void {
  state.activeMonitors.clear();
}

export interface MonitorParameters<TSourcePayload = unknown, TDragData = unknown> {
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
    | ((eventDetails: DraggableRootMoveStartEventDetails<TSourcePayload, TDragData>) => void)
    | undefined;
  /**
   * Event handler called as the pointer moves or a modifier key changes,
   * at most once per animation frame.
   */
  onMove?:
    ((eventDetails: DraggableRootMoveEventDetails<TSourcePayload, TDragData>) => void) | undefined;
  /**
   * Event handler called when the drop targets under the pointer change.
   */
  onTargetChange?:
    | ((eventDetails: DraggableRootTargetChangeEventDetails<TSourcePayload, TDragData>) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends, after a drop, a release outside any
   * target, or a cancellation. `eventDetails.target` is the target that received the drop,
   * or `null`. `eventDetails.canceled` tells a cancel from a release, and
   * `eventDetails.reason` gives the specific cause. It can fire without a preceding
   * `onMoveStart`, for example when the monitor registered during the drag.
   */
  onMoveEnd?:
    | ((eventDetails: DraggableRootMoveEndEventDetails<TSourcePayload, TDragData>) => void)
    | undefined;
}
