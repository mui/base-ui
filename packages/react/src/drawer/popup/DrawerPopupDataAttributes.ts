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
 * Present when the drawer begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the drawer is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
/**
 * Present when the drawer is at the expanded (full-height) snap point.
 */
export const expanded = 'data-expanded';
/**
 * Present when a nested drawer is open.
 */
export const nestedDrawerOpen = 'data-nested-drawer-open';
/**
 * Present when a nested drawer is being swiped.
 */
export const nestedDrawerSwiping = 'data-nested-drawer-swiping';
/**
 * Present when the drawer is dismissed by swiping.
 */
export const swipeDismiss = 'data-swipe-dismiss';
/**
 * Indicates the swipe direction.
 * @type {'up' | 'down' | 'left' | 'right'}
 */
export const swipeDirection = 'data-swipe-direction';
/**
 * Present when the drawer is being swiped.
 */
export const swiping = 'data-swiping';
