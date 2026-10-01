import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

/**
 * Present when the checkbox is checked.
 */
export const checked = 'data-checked';
/**
 * Present when the checkbox is not checked.
 */
export const unchecked = 'data-unchecked';
/**
 * Present when the checkbox is in an indeterminate state.
 */
export const indeterminate = 'data-indeterminate';
/**
 * Present when the checkbox is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the checkbox is readonly.
 */
export const readonly = 'data-readonly';
/**
 * Present when the checkbox is required.
 */
export const required = 'data-required';
/**
 * Present when the checkbox indicator begins animating in.
 */
export const startingStyle = TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the checkbox indicator is animating out.
 */
export const endingStyle = TransitionStatusDataAttributes.endingStyle;
/**
 * Present when the checkbox is in a valid state (when wrapped in Field.Root).
 */
export const valid = 'data-valid';
/**
 * Present when the checkbox is in an invalid state (when wrapped in Field.Root).
 */
export const invalid = 'data-invalid';
/**
 * Present when the checkbox has been touched (when wrapped in Field.Root).
 */
export const touched = 'data-touched';
/**
 * Present when the checkbox's value has changed (when wrapped in Field.Root).
 */
export const dirty = 'data-dirty';
/**
 * Present when the checkbox is checked (when wrapped in Field.Root).
 */
export const filled = 'data-filled';
/**
 * Present when the checkbox is focused (when wrapped in Field.Root).
 */
export const focused = 'data-focused';
