import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export const NavigationMenuContentDataAttributes = {
  /**
   * Present when the popup is open.
   */
  open: CommonPopupDataAttributes.open,
  /**
   * Present when the popup is closed.
   */
  closed: CommonPopupDataAttributes.closed,
  /**
   * Present when the content is animating in.
   */
  startingStyle: CommonPopupDataAttributes.startingStyle,
  /**
   * Present when the content is animating out.
   */
  endingStyle: CommonPopupDataAttributes.endingStyle,
  /**
   * Which direction another trigger was activated from.
   */
  activationDirection: 'data-activation-direction',
} as const;
