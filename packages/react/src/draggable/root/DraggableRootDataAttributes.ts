import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present on the source element while it is being dragged.
 * A cloned preview never carries this attribute, so a `[data-dragging]`
 * rule that dims or hides the source leaves the preview fully visible.
 */
export const dragging = 'data-dragging';
/**
 * Present on the source after a deliberate release while a clone created by
 * Base UI settles into its final position, including a return after release
 * outside a target. Use it to keep the source styled as a placeholder until
 * the preview's ending animation finishes.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
/**
 * Present while the draggable is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present while the nearest `Draggable.CollisionProvider` would insert the dragged
 * item before this element.
 */
export const collisionBefore = 'data-collision-before';
/**
 * Present while the nearest `Draggable.CollisionProvider` would insert the dragged
 * item after this element.
 */
export const collisionAfter = 'data-collision-after';
