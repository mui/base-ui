/**
 * Maximum distance, in pixels, the cursor may move away from the point where the
 * context menu opened (on each axis) while still being treated as part of the
 * opening gesture. Within this tolerance the `mouseup` that follows the right click
 * is ignored and a second right click toggles the menu closed; moving farther turns
 * the gesture into a press-drag-release that can dismiss the menu or activate an item.
 */
export const CONTEXT_MENU_MOVE_THRESHOLD = 8;

/**
 * Determines if the coordinates are within `threshold` pixels (on each axis) of the
 * point, typically the one the context menu was opened at.
 */
export function isWithinThreshold(
  point: { x: number; y: number } | null,
  x: number,
  y: number,
  threshold: number,
): boolean {
  return !!point && Math.abs(x - point.x) <= threshold && Math.abs(y - point.y) <= threshold;
}
