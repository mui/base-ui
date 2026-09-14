import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the scroll arrow begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the scroll arrow is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
/**
 * Indicates the direction of the scroll arrow.
 * @type {'up'}
 */
export const direction = 'data-direction';
/**
 * Present when the scroll arrow is visible.
 */
export const visible = 'data-visible';
/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
export const side = CommonPopupDataAttributes.side;
