import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present on the drag preview: the clone of the source, or the `Draggable.Preview`
 * element that renders custom children. A clone keeps the source's classes, so use
 * this attribute to distinguish them in CSS, and to exclude the preview from DOM
 * queries over the source's siblings, such as `:scope > :not([data-drag-preview])`.
 */
export const dragPreview = 'data-drag-preview';
/**
 * Present on the preview after a deliberate release while it ends. A `translate`
 * transition that applies then moves it to the source's final position, or back to
 * the source after a release outside every target. Without one, the preview ends
 * where it was released. It remains mounted until animations started by this state
 * finish.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
/**
 * Present on the preview while it ends after a drop on a target. Absent when it ends
 * after a release outside every target.
 */
export const dropped = 'data-dropped';
