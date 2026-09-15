import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the menu checkbox item is checked.
 */
export const checked = 'data-checked';
/**
 * Present when the menu checkbox item is not checked.
 */
export const unchecked = 'data-unchecked';
/**
 * Present when the menu checkbox item is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the indicator begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the indicator is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
