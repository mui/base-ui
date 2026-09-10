import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the corresponding select is open.
 */
export const popupOpen = CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the trigger is pressed.
 */
export const pressed = CommonTriggerDataAttributes.pressed;
/**
 * Present when the select is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the select is readonly.
 */
export const readonly = 'data-readonly';
/**
 * Indicates which side the corresponding popup is positioned relative to its anchor.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start' | null}
 */
export const popupSide = 'data-popup-side';
/**
 * Present when the select is required.
 */
export const required = 'data-required';
/**
 * Present when the select is in a valid state (when wrapped in Field.Root).
 */
export const valid = 'data-valid';
/**
 * Present when the select is in an invalid state (when wrapped in Field.Root).
 */
export const invalid = 'data-invalid';
/**
 * Present when the select has been touched (when wrapped in Field.Root).
 */
export const touched = 'data-touched';
/**
 * Present when the select's value has changed (when wrapped in Field.Root).
 */
export const dirty = 'data-dirty';
/**
 * Present when the select has a value (when wrapped in Field.Root).
 */
export const filled = 'data-filled';
/**
 * Present when the select trigger is focused (when wrapped in Field.Root).
 */
export const focused = 'data-focused';
/**
 * Present when the select doesn't have a value.
 */
export const placeholder = 'data-placeholder';
