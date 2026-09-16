/**
 * The data attributes the engine writes on consumer elements, in one place so a
 * rename or an addition is a single edit. The public `*DataAttributes` enums of
 * `Draggable`, `Draggable.Preview`, and `DropTarget` restate these for the docs;
 * their `enumSync` tests keep the two in step.
 */

/**
 * Set on the drag source for the whole drag, so a consumer can dim it with one
 * CSS rule — `[data-dragging] { opacity: 0.4 }`. The default preview is a clone
 * anchored to the grab point, so it starts out exactly on top of the source;
 * without dimming the two read as one element. The engine deliberately does not
 * hide the source itself — that is an opinion the CSS should own.
 */
export const DRAGGING_ATTR = 'data-dragging';

/** Set on the source and the preview while the drop transition plays. */
export const ENDING_STYLE_ATTR = 'data-ending-style';

/**
 * Marks the preview so consumers can style it with the source's own selector —
 * `.Card[data-drag-preview] { box-shadow: … }`. This only works because the clone
 * keeps the source's classes and the engine writes *geometry* inline and nothing
 * else; any visual property written inline would beat every class rule.
 */
export const DRAG_PREVIEW_ATTR = 'data-drag-preview';

/** Marks every registered drop target, so the hit-test walk can find them with one selector. */
export const DROP_TARGET_ATTR = 'data-drop-target';
