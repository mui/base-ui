import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present on the drag preview, whether it's a clone of the source or custom content.
 * A clone keeps the source's classes, so use this attribute to tell them apart in CSS
 * and to exclude the preview from queries over the source's siblings, such as
 * `:scope > :not([data-drag-preview])`.
 */
export const dragPreview = 'data-drag-preview';
/**
 * Present on the preview while it ends after a deliberate release. A `translate`
 * transition then moves it to the source's final position, or back to the source
 * after a release outside every target. Without one, it ends where it was released.
 * The preview stays mounted until animations started by this state finish.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
/**
 * Present on the preview while it ends after a drop on a target. Absent when it ends
 * after a release outside every target.
 */
export const dropped = 'data-dropped';
