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
 * Present when the content begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the content is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
/**
 * Which direction another trigger was activated from.
 * @type {'left' | 'right' | 'up' | 'down'}
 */
export const activationDirection = 'data-activation-direction';
