import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Indicates the index of the accordion item.
 * @type {number}
 */
export const index = 'data-index';
/**
 * Present when the accordion panel is open.
 */
export const open = 'data-open';
/**
 * Indicates the orientation of the accordion.
 */
export const orientation = 'data-orientation';
/**
 * Present when the accordion item is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the panel begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the panel is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
