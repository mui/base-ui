/**
 * The drag in progress, as the rest of the engine sees it.
 *
 * `start()` in `lifecycleManager.ts` creates the session and is its only writer.
 * Drop targets, monitors, auto-scroll, payload sync and the preview's React content
 * read it here instead of each keeping a copy of the source or inferring the phase.
 * The module holds only the shared slot, so reading the session doesn't load the
 * lifecycle or the sensor.
 */

import type {
  DraggableInput,
  DraggableLocationHistory,
} from '../../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import type { SyntheticPreviewHandle } from '../synthetic/syntheticPreview';
import type { DragCleanupFn } from '../types';
import { getSharedSlot } from '../sharedState';

/**
 * - `starting`: from pickup until the first snapshot is published. Monitors engage,
 *   the initial stack resolves and the source's `onGenerateDragPreview` runs. No
 *   target has received an event yet.
 * - `live`: from the first publish until the end sequence begins.
 * - `ending`: a drop, a cancel or error recovery is delivering the terminal events.
 */
export type DragSessionPhase = 'starting' | 'live' | 'ending';

export interface DragSession {
  readonly phase: DragSessionPhase;
  /**
   * The source every event of the drag reports. It is mutated in place, not
   * replaced, when a virtualizer remounts the source (see `retargetDragSource`).
   */
  readonly source: DraggableRootRecord;
  /**
   * The press point minus the source's border-box origin, in client pixels,
   * measured before `[data-dragging]` styles apply.
   */
  readonly grabOffset: Readonly<{ x: number; y: number }>;
  /** The preview the sensor built, until the end sequence begins. */
  readonly preview: SyntheticPreviewHandle | null;
  /** A copy of the location, as the handler running now sees it. */
  getLocation(): DraggableLocationHistory;
  /**
   * The sensor's input before `modifiers` apply, or `null` when the sensor doesn't
   * track one, such as before `start()` returns.
   */
  getRawInput(): DraggableInput | null;
  /** Tells the sensor that something scrolled under a stationary pointer. */
  notifyScroll(): void;
  /**
   * Cancels the drag with the `'imperative-action'` reason. The sensor releases its
   * gesture before the terminal events go out. Does nothing once the end sequence
   * has begun.
   */
  cancel(): void;
  /**
   * Runs `listener` once when the session ends, whatever the cause: a drop, a
   * cancel, a handler error or a test reset. Unlike a monitor's `onMoveEnd`, it
   * also runs when the session ends without terminal events.
   */
  onEnd(listener: () => void): DragCleanupFn;
  /**
   * Re-resolves the drop-target stack now and publishes a new snapshot, so a
   * hovered target that unregisters leaves the stack without waiting for a pointer
   * event. Does nothing once the end sequence has begun.
   *
   * Walks up from the last resolved target instead of hit-testing, because the DOM
   * under the pointer hasn't changed, only which of its ancestors are registered. A
   * React unmount runs this from the ref cleanup, inside the commit, where
   * `elementFromPoint` would force a needless synchronous layout. It hit-tests
   * again only when the last target has been detached.
   */
  refreshTargets(): void;
  /**
   * Coalesces a parameter or registration change into one stack resolution in a
   * microtask. With an `element`, it runs only when that element is on the walk
   * from the last target. `rehitTest` hit-tests at the pointer again instead of
   * walking up from the last target.
   */
  scheduleTargetRefresh(element: Element | null, rehitTest?: boolean): void;
  /**
   * Whether `element` has received an enter but not the matching leave. It updates
   * before the published snapshot does.
   */
  isTargetHovered(element: Element): boolean;
}

interface DragSessionSlot {
  session: DragSession | null;
  /** Ends `session` without terminal events. See {@link resetForTests}. */
  abort: (() => void) | null;
}

const slot = getSharedSlot<DragSessionSlot>('dragSession', () => ({
  session: null,
  abort: null,
}));

/** The drag in progress, or `null` when none is. */
export function getActiveSession(): DragSession | null {
  return slot.session;
}

/** Publish the drag in progress. Only the lifecycle calls this. */
export function setActiveSession(session: DragSession, abort: () => void): void {
  slot.session = session;
  slot.abort = abort;
}

/** Unpublish `session` if it is still the active one. Only the lifecycle calls this. */
export function clearActiveSession(session: DragSession): void {
  if (slot.session === session) {
    slot.session = null;
    slot.abort = null;
  }
}

/**
 * Ends the active session without terminal events. Only test cleanup uses it,
 * because a session recovering from a consumer throw tears itself down.
 */
export function resetForTests(): void {
  slot.abort?.();
}
