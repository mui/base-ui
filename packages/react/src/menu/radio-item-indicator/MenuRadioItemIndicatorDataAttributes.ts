import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the menu radio item is selected.
 */
export const checked = 'data-checked';
/**
 * Present when the menu radio item is not selected.
 */
export const unchecked = 'data-unchecked';
/**
 * Present when the menu radio item is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the radio indicator begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the radio indicator is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
