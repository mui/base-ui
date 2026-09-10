import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the corresponding popup is open.
 */
export const popupOpen = CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the trigger is pressed.
 */
export const pressed = CommonTriggerDataAttributes.pressed;
/**
 * Present when the component is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the component is readonly.
 */
export const readonly = 'data-readonly';
/**
 * Indicates which side the corresponding popup is positioned relative to its anchor.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start' | null}
 */
export const popupSide = 'data-popup-side';
/**
 * Present when the component is required.
 */
export const required = 'data-required';
/**
 * Present when the component is in a valid state (when wrapped in Field.Root).
 */
export const valid = 'data-valid';
/**
 * Present when the component is in an invalid state (when wrapped in Field.Root).
 */
export const invalid = 'data-invalid';
/**
 * Present when the component has been touched (when wrapped in Field.Root).
 */
export const touched = 'data-touched';
/**
 * Present when the component's value has changed (when wrapped in Field.Root).
 */
export const dirty = 'data-dirty';
/**
 * Present when the component has a value (when wrapped in Field.Root).
 */
export const filled = 'data-filled';
/**
 * Present when the trigger is focused (when wrapped in Field.Root).
 */
export const focused = 'data-focused';
/**
 * Present when the corresponding items list is empty.
 */
export const listEmpty = 'data-list-empty';
