import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the drawer is open.
 */
export const open = CommonPopupDataAttributes.open;
/**
 * Present when the drawer is closed.
 */
export const closed = CommonPopupDataAttributes.closed;
/**
 * Present when the swipe area is disabled.
 */
export const disabled = 'data-disabled';
/**
 * Indicates the swipe direction.
 * @type {'up' | 'down' | 'left' | 'right'}
 */
export const swipeDirection = 'data-swipe-direction';
/**
 * Present when the drawer is being swiped.
 */
export const swiping = 'data-swiping';
