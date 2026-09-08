import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Indicates which side the toast is positioned relative to the anchor.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
export const side = CommonPopupDataAttributes.side;
/**
 * Indicates how the toast is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
export const align = CommonPopupDataAttributes.align;
/**
 * Present when the toast arrow is uncentered.
 */
export const uncentered = 'data-uncentered';
