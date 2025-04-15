import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum PopoverArrowDataAttributes {
  /**
   * Present when the popup is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the popup is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = CommonPopupDataAttributes.anchorHidden,
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Present when the popover arrow is uncentered.
   */
  uncetered = 'data-uncentered',
}
