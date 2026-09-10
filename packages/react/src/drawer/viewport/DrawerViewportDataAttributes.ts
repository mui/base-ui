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
 * Present when the drawer is nested within another drawer.
 */
export const nested = 'data-nested';
