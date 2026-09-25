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
export const settling = 'data-settling';
/**
 * Present while the draggable is disabled.
 */
export const disabled = 'data-disabled';
