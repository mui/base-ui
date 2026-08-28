import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present while the image is loading.
 */
export const loading = 'data-loading';
/**
 * Present when the image failed to load.
 */
export const error = 'data-error';
/**
 * Present when the image begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the image is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
