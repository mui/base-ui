/**
 * Present on the source element while it is being dragged, and until its preview
 * has settled after the drop. A preview never carries this attribute, so a
 * `[data-dragging]` rule that dims or hides the source leaves the preview fully visible.
 */
export const dragging = 'data-dragging';
/**
 * Present on the source after a deliberate release, on a target or outside every
 * target, until its preview's ending animation finishes. Use it to keep the source
 * styled as a placeholder until then.
 */
export const settling = 'data-settling';
/**
 * Present while the draggable is disabled.
 */
export const disabled = 'data-disabled';
