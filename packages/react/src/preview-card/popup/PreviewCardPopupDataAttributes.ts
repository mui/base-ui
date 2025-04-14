import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum PreviewCardPopupDataAttributes {
  /**
   * Present when the preview card is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the preview card is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the preview card is animating in.
   */
  startingStyle = CommonPopupDataAttributes.startingStyle,
  /**
   * Present when the preview card is animating out.
   */
  endingStyle = CommonPopupDataAttributes.endingStyle,
  /**
   * Indicates which side the preview card is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
}
