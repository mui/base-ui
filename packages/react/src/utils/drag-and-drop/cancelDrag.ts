import { cancelActiveDrag as cancelActivePointerDrag } from './synthetic/syntheticSensor';
import { cancelLifecycleDrag } from './core/lifecycleManager';

/**
 * Cancels the drag in progress. Fires `onMoveEnd` with a `null` target and the
 * `'imperative-action'` reason. Does nothing when no drag is active.
 *
 * Like the functions in `./registrations`, it has no per-instance state because
 * the drag state is global. The engine re-exposes it as `cancelDrag`.
 */
export function cancelDrag(): void {
  cancelActivePointerDrag();
  // During the synchronous start dispatches (`onGenerateDragPreview`,
  // `onMoveStart`), the sensor hasn't recorded the session yet, so the call above
  // does nothing. The lifecycle-level cancel reaches that session directly, and
  // does nothing once a sensor-owned cancel has torn the lifecycle down.
  cancelLifecycleDrag();
}
