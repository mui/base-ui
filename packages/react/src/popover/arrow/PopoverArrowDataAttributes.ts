import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the popup is open.
 */
export const open = CommonPopupDataAttributes.open;
/**
 * Present when the popup is closed.
 */
export const closed = CommonPopupDataAttributes.closed;
/**
 * Indicates which side the popup is positioned relative to the trigger.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
export const side = CommonPopupDataAttributes.side;
/**
 * Indicates how the popup is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
export const align = CommonPopupDataAttributes.align;
/**
 * Present when the popover arrow is uncentered.
 */
export const uncentered = 'data-uncentered';
