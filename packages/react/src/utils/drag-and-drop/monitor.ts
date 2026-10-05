import { matchesAccept } from './dragKind';
import type { DraggableAccept } from '../../draggable/DraggableProvider';
import type {
  DraggableRootRecord,
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEventDetails,
  DraggableRootMoveStartEventDetails,
  DraggableRootTargetChangeEventDetails,
} from '../../draggable/root/DraggableRoot';
import type { DraggableEventDetailsMap } from './types';
import { getSharedSlot } from './sharedState';
import { containConsumerError, getShallowSnapshot } from './utils';

/** Returns a monitor's latest parameters. Read on each dispatch. */
type MonitorGetter = () => MonitorParameters<any, any>;

interface MonitorState {
  /** The parameters getter of every registered monitor. */
  allMonitors: Set<MonitorGetter>;
  /** The getters of the monitors observing the current drag, whose `accept` matched. */
  activeMonitors: Set<MonitorGetter>;
  /** The active drag's source, so a monitor registered mid-drag can join it. */
  activeSource: DraggableRootRecord | null;
  /**
   * The last parameters of each engaged monitor whose `accept` matched. A monitor
   * whose `accept` stops matching mid-drag still gets `onMoveEnd` through them.
   * They are shallow copies, so a getter that mutates one object in place can't
   * change them, and are copied only when their fields change.
   */
  matchedMonitors: WeakMap<MonitorGetter, MonitorParameters>;
}

const state = getSharedSlot<MonitorState>('registerMonitor', () => ({
  allMonitors: new Set<MonitorGetter>(),
  activeMonitors: new Set<MonitorGetter>(),
  activeSource: null,
  matchedMonitors: new WeakMap<MonitorGetter, MonitorParameters>(),
}));

/**
 * Engages a monitor in the active drag when its `accept` matches the source. Runs
 * for every monitor at drag start, and for a monitor that registers mid-drag, such
 * as one in a scroll container that mounts during the drag. That monitor missed
 * `onMoveStart` and receives only the later events. Does nothing when no drag is
 * active or the monitor is already engaged.
 */
function engageMonitorIfDragging(getMonitor: MonitorGetter): void {
  const activeSource = state.activeSource;
  // Skip monitors already engaged for this drag so the activation loop and the
  // mid-drag registration path can't add the same getter twice.
  if (!activeSource || state.activeMonitors.has(getMonitor)) {
    return;
  }
  // Contained like `dispatchToMonitors`, because the getter is consumer code. A
  // throw from `start()` would abort the drag for everyone, and a throw from a
  // mid-drag layout effect would escape React's commit. A monitor whose getter
  // throws skips this drag.
  const monitor = containConsumerError(
    "Base UI: a drag monitor's parameters getter threw, so the monitor was skipped for this drag.",
    null,
    getMonitor,
    null,
  );
  // The getter may have ended the drag, or ended it and started another. Engage
  // the monitor only in the drag it was evaluated against. A getter written in
  // plain JS can also return `undefined`.
  if (
    monitor != null &&
    state.activeSource === activeSource &&
    matchesAccept(monitor.accept, activeSource)
  ) {
    state.activeMonitors.add(getMonitor);
    getShallowSnapshot(state.matchedMonitors, getMonitor, monitor);
  }
}

/** Register a monitor getter. One registered mid-drag joins the drag for its remainder. */
export function addMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.add(getMonitor);
  engageMonitorIfDragging(getMonitor);
}

/** Remove a monitor getter from the registry and from the current drag. */
export function removeMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.delete(getMonitor);
  state.activeMonitors.delete(getMonitor);
  state.matchedMonitors.delete(getMonitor);
}

export function activateMonitors(source: DraggableRootRecord): void {
  // Set before the loop, because `engageMonitorIfDragging` reads it. It also
  // lets a monitor that registers later in the drag match against it.
  state.activeSource = source;
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
    // Contained per monitor, like each drop target's dispatch. One throwing
    // monitor must not stop the others or unwind the dispatch in progress.
    containConsumerError(
      'Base UI: a drag monitor threw and was skipped for this event.',
      null,
      () => {
        let monitor = getMonitor();
        if (matchesAccept(monitor.accept, eventDetails.source)) {
          getShallowSnapshot(state.matchedMonitors, getMonitor, monitor);
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
  state.activeSource = null;
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
   * `eventDetails.reason` gives the specific cause.
   *
   * It can fire without a preceding `onMoveStart`, for example when the monitor
   * registered during the drag, so don't assume the two are paired.
   */
  onMoveEnd?:
    | ((eventDetails: DraggableRootMoveEndEventDetails<TSourcePayload, TDragData>) => void)
    | undefined;
}
