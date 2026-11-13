import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present while the preview ends after a deliberate release. A `translate` transition
 * on the positioner then moves it to the source's final position, or back to the source
 * after a release outside every target. Without one, it ends where it was released.
 * The preview stays mounted until animations started by this state finish.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
/**
 * Present while the preview ends after a drop on a target. Absent when it ends after a
 * release outside every target.
 */
export const dropped = 'data-dropped';
