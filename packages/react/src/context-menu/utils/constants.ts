/**
 * Maximum distance, in pixels, the cursor may move away from the point where the
 * context menu opened (on each axis) while still being treated as part of the
 * opening gesture. Within this tolerance the `mouseup` that follows the right click
 * is ignored and a second right click toggles the menu closed; moving farther turns
 * the gesture into a press-drag-release that can dismiss the menu or activate an item.
 */
export const CONTEXT_MENU_MOVE_THRESHOLD = 8;
