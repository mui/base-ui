import { matchesAccept } from './dragKind';
import type { DragAccept, DragSource, DragEventDetailsMap, DragEventMap } from '../../types/drag';
import { getSharedSlot } from './sharedState';
import { containConsumerError } from './utils';

/** A getter for a monitor's latest parameters, read fresh on each dispatch. */
type MonitorGetter<TSourceData = any> = () => RegisterMonitorParameters<TSourceData>;

interface MonitorState {
  allMonitors: Set<MonitorGetter>;
  /** Monitor getters observing the current drag (their `accept` matched). */
  activeMonitors: Set<MonitorGetter>;
  /** The active drag's source, so a monitor registered mid-drag can join it. */
  activeSource: DragSource | null;
}

const state = getSharedSlot<MonitorState>('registerMonitor', () => ({
  allMonitors: new Set<MonitorGetter>(),
  activeMonitors: new Set<MonitorGetter>(),
  activeSource: null,
}));

/** The monitor registry: a getter per monitor for its latest parameters. */
export const monitorRegistry = state.allMonitors;

/**
 * Evaluate a just-registered monitor against an in-progress drag so it observes
 * the remainder of the active drag (e.g. a scroll container mounting mid-drag).
 * `onDragStart` has already fired, so it only receives subsequent events. No-op
 * when no drag is active or the monitor is already engaged.
 */
export function engageMonitorIfDragging(getMonitor: MonitorGetter): void {
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
  if (monitor !== null && matchesAccept(monitor.accept, activeSource)) {
    state.activeMonitors.add(getMonitor);
  }
}

/** Remove a monitor getter from both the registry and the active set. */
export function removeMonitor(getMonitor: MonitorGetter): void {
  state.allMonitors.delete(getMonitor);
  state.activeMonitors.delete(getMonitor);
}

export function activateMonitors(source: DragSource): void {
  // Mutate in place so a duplicate bundled copy of the engine shares the set.
  state.activeMonitors.clear();
  // Remember the source before the loop: `engageMonitorIfDragging` reads it,
  // and it is also what lets a monitor registered mid-drag be matched against
  // the in-progress drag.
  state.activeSource = source;
  for (const getMonitor of state.allMonitors) {
    engageMonitorIfDragging(getMonitor);
  }
}

export function dispatchToMonitors<K extends keyof DragEventMap & keyof RegisterMonitorParameters>(
  eventName: K,
  payload: DragEventMap[K],
  eventDetails: DragEventDetailsMap[K],
): void {
  if (state.activeMonitors.size === 0) {
    return;
  }

  // The inferred auto-scroll monitor is the common case. Dispatch it directly
  // rather than allocating a one-entry snapshot for every drag frame. Nothing
  // can engage between reading the entry and invoking it, and a monitor added
  // by the handler still cannot receive the in-flight event.
  if (state.activeMonitors.size === 1) {
    const getMonitor = state.activeMonitors.values().next().value;
    if (getMonitor !== undefined) {
      dispatchToMonitor(getMonitor, eventName, payload, eventDetails);
    }
    return;
  }

  // Snapshot so a monitor engaging mid-dispatch doesn't receive the in-flight
  // event; the `has` re-check skips monitors a handler removed under us.
  const snapshot = [...state.activeMonitors];
  for (const getMonitor of snapshot) {
    if (!state.activeMonitors.has(getMonitor)) {
      continue;
    }
    dispatchToMonitor(getMonitor, eventName, payload, eventDetails);
  }
}

function dispatchToMonitor<K extends keyof DragEventMap & keyof RegisterMonitorParameters>(
  getMonitor: MonitorGetter,
  eventName: K,
  payload: DragEventMap[K],
  eventDetails: DragEventDetailsMap[K],
): void {
  // Contained per monitor, like each drop target's dispatch: a monitor is an
  // observer, and one broken observer must not starve the rest of them or
  // unwind the dispatch sequence that is mid-flight.
  containConsumerError(
    'Base UI: a drag monitor threw and was skipped for this event.',
    null,
    () => {
      const handler = getMonitor()[eventName] as
        ((parameters: DragEventMap[K], details: DragEventDetailsMap[K]) => void) | undefined;
      handler?.(payload, eventDetails);
    },
    undefined,
  );
}

export function clearActiveMonitors(): void {
  state.activeMonitors.clear();
  state.activeSource = null;
}

export interface RegisterMonitorParameters<TSourceData = unknown> {
  /**
   * One or more drag source kinds observed by this monitor. Omit it to observe
   * every drag with `source.payload` typed as `unknown`.
   *
   * Base UI evaluates this value when the monitor joins a drag, either at drag
   * start or when the monitor registers during a drag. If the value excludes the
   * drag, the monitor ignores its remaining events. Return early from callbacks to
   * apply more specific filters.
   */
  accept?: DragAccept<TSourceData> | undefined;
  /**
   * Event handler called when any matching drag starts (once per drag),
   * wherever it originated.
   */
  onDragStart?:
    | ((
        parameters: DragEventMap<TSourceData>['onDragStart'],
        eventDetails: DragEventDetailsMap['onDragStart'],
      ) => void)
    | undefined;
  /**
   * Event handler called (rAF-throttled) as the pointer moves or a modifier key
   * changes during any matching drag.
   */
  onDrag?:
    | ((
        parameters: DragEventMap<TSourceData>['onDrag'],
        eventDetails: DragEventDetailsMap['onDrag'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the active drop-target stack changes during any
   * matching drag.
   */
  onDropTargetChange?:
    | ((
        parameters: DragEventMap<TSourceData>['onDropTargetChange'],
        eventDetails: DragEventDetailsMap['onDropTargetChange'],
      ) => void)
    | undefined;
  /**
   * Event handler called when a matching drag is released over an accepting drop
   * target, and only then. `dropTarget` is never `null` here.
   */
  onDrop?:
    | ((
        parameters: DragEventMap<TSourceData>['onDrop'],
        eventDetails: DragEventDetailsMap['onDrop'],
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends after a drop, outside release, or
   * cancellation. `eventDetails.reason` identifies the outcome. `dropTarget` is the
   * target of a release, or `null` when there was none.
   */
  onDragEnd?:
    | ((
        parameters: DragEventMap<TSourceData>['onDragEnd'],
        eventDetails: DragEventDetailsMap['onDragEnd'],
      ) => void)
    | undefined;
}
