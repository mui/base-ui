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
 * Present when the popup begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the popup is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
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
 * Present if animations should be instant.
 * @type {'click' | 'dismiss'}
 */
export const instant = 'data-instant';
/**
 * Present when the items list is empty.
 */
export const empty = 'data-empty';
