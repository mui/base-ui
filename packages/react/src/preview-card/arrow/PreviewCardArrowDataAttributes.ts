import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum PreviewCardArrowDataAttributes {
  /**
   * Present when the preview card is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the preview card is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = CommonPopupDataAttributes.anchorHidden,
  /**
   * Indicates which side the preview card is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Present when the preview card arrow is uncentered.
   */
  uncetered = 'data-uncentered',
}
