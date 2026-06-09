/**
 * Maximum distance, in pixels, the cursor may move away from the point where the
 * context menu opened (on each axis) while still being treated as part of the
 * opening gesture. Within this tolerance the `mouseup` that follows the right click
 * is ignored and a second right click toggles the menu closed; moving farther turns
 * the gesture into a press-drag-release that can dismiss the menu or activate an item.
 */
export const CONTEXT_MENU_MOVE_THRESHOLD = 8;

/**
 * Maximum distance, in pixels, from the point where the context menu opened within
 * which the `mouseup` completing the opening right click is prevented from
 * activating a menu item rendered under the cursor. Kept much tighter than
 * `CONTEXT_MENU_MOVE_THRESHOLD`: a deliberate press-drag-release onto a nearby item
 * (which highlights it) must still activate it.
 */
export const CONTEXT_MENU_ITEM_PRESS_THRESHOLD = 1;
