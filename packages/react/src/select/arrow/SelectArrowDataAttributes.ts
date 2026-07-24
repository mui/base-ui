import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the select popup is open.
 */
export const open = CommonPopupDataAttributes.open;
/**
 * Present when the select popup is closed.
 */
export const closed = CommonPopupDataAttributes.closed;
/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
export const side = CommonPopupDataAttributes.side;
/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
export const align = CommonPopupDataAttributes.align;
/**
 * Present when the select arrow is uncentered.
 */
export const uncentered = 'data-uncentered';
