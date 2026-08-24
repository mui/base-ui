import { cancelActiveDrag as cancelActivePointerDrag } from './synthetic/syntheticSensor';
import { cancelActiveDrag as cancelActiveKeyboardDrag } from './keyboard/keyboardSensor';
import { cancelLifecycleDrag } from './core/lifecycleManager';

/**
 * Cancel the drag in progress, if any. Fires `onDragEnd` with `canceled: true`
 * (and, for a keyboard drag, restores focus and announces the cancellation), and
 * is a no-op when nothing is being dragged.
 *
 * Carries no per-instance state, like the primitives in `./registrations`: the
 * drag state is global, so the engine simply re-exposes this as `cancelDrag`.
 */
export function cancelDrag(): void {
  // The active drag lives in one sensor at a time; the inactive one no-ops, so
  // cancelling both covers whichever owns the gesture.
  cancelActivePointerDrag();
  cancelActiveKeyboardDrag();
  // During the synchronous start dispatches (`onGenerateDragPreview` /
  // `onDragStart`) no sensor has recorded the session yet, so both calls above
  // no-op; the lifecycle-level cancel reaches the in-flight session directly.
  // It is itself a no-op once a sensor-owned cancel has torn the lifecycle down.
  cancelLifecycleDrag();
}
