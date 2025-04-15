import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum TooltipPopupDataAttributes {
  /**
   * Present when the tooltip is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the tooltip is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the tooltip is animating in.
   */
  startingStyle = CommonPopupDataAttributes.startingStyle,
  /**
   * Present when the tooltip is animating out.
   */
  endingStyle = CommonPopupDataAttributes.endingStyle,
  /**
   * Indicates which side the tooltip is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Present if animations should be instant.
   * @type {'delay' | 'dismiss' | 'focus'}
   */
  instant = 'data-instant',
}
