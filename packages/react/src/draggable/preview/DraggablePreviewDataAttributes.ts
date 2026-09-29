import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present on the drag preview: the clone of the source, or the `Draggable.Preview`
 * element that renders custom children. A clone keeps the source's classes, so use
 * this attribute to distinguish them in CSS.
 */
export const dragPreview = 'data-drag-preview';
/**
 * Present on the element Base UI inserts beside the source, or into the preview
 * `container`, to hold the preview during a drag. Exclude it from DOM queries over
 * the source's siblings, such as `:scope > :not([data-drag-preview-container])`.
 */
export const dragPreviewContainer = 'data-drag-preview-container';
/**
 * Present on a cloned preview created by Base UI after a deliberate release while
 * it moves to its final position. This also applies when a drag is released
 * outside a target and returns to its source. The clone remains mounted until
 * animations started by this state finish.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
