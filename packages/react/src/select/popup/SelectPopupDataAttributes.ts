import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the select is open.
 */
export const open = CommonPopupDataAttributes.open;
/**
 * Present when the select is closed.
 */
export const closed = CommonPopupDataAttributes.closed;
/**
 * Present when the select begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the select is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
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
