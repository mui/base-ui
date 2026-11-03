import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Always present. An empty preview keeps the trigger's classes, so use it in CSS to
 * style the preview apart from the trigger.
 */
export const dragPreview = 'data-drag-preview';
/** Present while the preview ends after a deliberate release. */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
/**
 * Present while the preview ends after a drop on a target. Absent when it ends after a
 * release outside every target.
 */
export const dropped = 'data-dropped';
