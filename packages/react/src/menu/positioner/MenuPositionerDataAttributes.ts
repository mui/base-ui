import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export enum MenuPositionerDataAttributes {
  /**
   * Present when the menu popup is open.
   */
  open = CommonPopupDataAttributes.open,
  /**
   * Present when the menu popup is closed.
   */
  closed = CommonPopupDataAttributes.closed,
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = CommonPopupDataAttributes.anchorHidden,
  /**
   * Indicates which side the menu is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
}
