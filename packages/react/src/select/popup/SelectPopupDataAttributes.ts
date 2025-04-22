import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum SelectPopupDataAttributes {
  /**
   * Present when the select is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the select is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the select is animating in.
   */
  startingStyle = CommonPopupDataAttributes.startingStyle,
  /**
   * Present when the select is animating out.
   */
  endingStyle = CommonPopupDataAttributes.endingStyle,
  /**
   * Indicates which side the select is positioned relative to the trigger.
   * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
}
