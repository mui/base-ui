import {
  CommonPopupDataAttributes,
  CommonTriggerDataAttributes,
} from '../../utils/popupStateMapping';

/**
 * Present when the corresponding popup is open.
 */
export const popupOpen = CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the button is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Present when the clear button is visible.
 */
export const visible = 'data-visible';
/**
 * Present when the button begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the button is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
