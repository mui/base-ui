import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum SelectArrowDataAttributes {
  /**
   * Present when the select popup is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the select popup is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = CommonPopupDataAttributes.anchorHidden,
  /**
   * Indicates which side the select is positioned relative to the trigger.
   * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Present when the select arrow is uncentered.
   */
  uncetered = 'data-uncentered',
}
