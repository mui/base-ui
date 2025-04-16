import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum TooltipPositionerDataAttributes {
  /**
   * Present when the tooltip is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the tooltip is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = CommonPopupDataAttributes.anchorHidden,
  /**
   * Indicates which side the tooltip is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
}
