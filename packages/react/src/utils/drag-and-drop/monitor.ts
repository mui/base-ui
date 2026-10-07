import { matchesAccept } from './dragKind';
import type { DraggableAccept } from '../../draggable/DraggableProvider';
import type {
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEventDetails,
  DraggableRootMoveStartEventDetails,
  DraggableRootRecord,
  DraggableRootTargetChangeEventDetails,
} from '../../draggable/root/DraggableRoot';
import type { DraggableEventDetailsMap } from './types';
import { getSharedSlot } from './sharedState';
import { containConsumerError, getShallowSnapshot } from './utils';

/** Returns a monitor's latest parameters. Read on each dispatch. */
type MonitorGetter = () => MonitorParameters<any, any>;

const state = getSharedSlot('registerMonitor', () => ({
  allMonitors: new Set<MonitorGetter>(),
}));

export function addMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.add(getMonitor);
}

export function removeMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.delete(getMonitor);
}

export interface MonitorDispatch {
  dispatch<K extends keyof DraggableEventDetailsMap & keyof MonitorParameters>(
    eventName: K,
    eventDetails: DraggableEventDetailsMap[K],
  ): void;
  /** Stops delivery, including the rest of a fan-out in progress. */
  end(): void;
}

/**
 * The monitors of one drag. Each registered monitor is checked against `source` at the
 * first dispatch it could receive, so one registered mid-drag joins at the next event.
 */
export function createMonitorDispatch(source: DraggableRootRecord): MonitorDispatch {
  const checked = new Set<MonitorGetter>();
  const engaged = new Set<MonitorGetter>();
  // Each engaged monitor's last parameters whose `accept` matched, so a monitor whose
  // `accept` stops matching mid-drag still gets `onMoveEnd`. Shallow copies, so a
  // getter that mutates one object in place can't change them.
  const matched = new WeakMap<MonitorGetter, MonitorParameters>();
  let ended = false;

  return {
    dispatch(eventName, eventDetails) {
      for (const getMonitor of state.allMonitors) {
        if (checked.has(getMonitor)) {
          continue;
        }
        checked.add(getMonitor);
        // The getter is consumer code. A throwing monitor skips this drag.
        const monitor = containConsumerError(
          "Base UI: a drag monitor's parameters getter threw, so the monitor was skipped for this drag.",
          null,
          getMonitor,
          null,
        );
        // The getter may have ended the drag. A plain-JS getter can also return `undefined`.
        if (!ended && monitor != null && matchesAccept(monitor.accept, source)) {
          engaged.add(getMonitor);
          getShallowSnapshot(matched, getMonitor, monitor);
        }
      }

      // Iterate a copy, so a monitor that engages mid-dispatch doesn't receive the
      // current event. The `has` checks skip monitors removed or ended meanwhile.
      for (const getMonitor of [...engaged]) {
        if (!engaged.has(getMonitor) || !state.allMonitors.has(getMonitor)) {
          continue;
        }
        // One throwing monitor must not stop the others or unwind the dispatch.
        containConsumerError(
          'Base UI: a drag monitor threw and was skipped for this event.',
          null,
          () => {
            let monitor = getMonitor();
            if (matchesAccept(monitor.accept, eventDetails.source)) {
              getShallowSnapshot(matched, getMonitor, monitor);
            } else {
              // `accept` no longer matches. Deliver only `onMoveEnd`, through the last
              // matching parameters, so the monitor can close the drag it joined.
              const previous = matched.get(getMonitor);
              if (eventName !== 'onMoveEnd' || !previous) {
                return;
              }
              monitor = previous;
            }
            const handler = monitor[eventName] as
              ((details: DraggableEventDetailsMap[typeof eventName]) => void) | undefined;
            handler?.(eventDetails);
          },
          undefined,
        );
      }
    },
    end() {
      ended = true;
      engaged.clear();
    },
  };
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
