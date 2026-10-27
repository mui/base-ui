import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the field is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the field is in a valid state.
 */
export const valid = 'data-valid';
/**
 * Present when the field is in an invalid state.
 */
export const invalid = 'data-invalid';
/**
 * Present when the field has been touched.
 */
export const touched = 'data-touched';
/**
 * Present when the field's value has changed.
 */
export const dirty = 'data-dirty';
/**
 * Present when the field is filled.
 */
export const filled = 'data-filled';
/**
 * Present when the field control is focused.
 */
export const focused = 'data-focused';
/**
 * Present when the error message begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the error message is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
