import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export const SelectBackdropDataAttributes = {
  /**
   * Present when the select is open.
   */
  open: CommonPopupDataAttributes.open,
  /**
   * Present when the select is closed.
   */
  closed: CommonPopupDataAttributes.closed,
  /**
   * Present when the select is animating in.
   */
  startingStyle: CommonPopupDataAttributes.startingStyle,
  /**
   * Present when the select is animating out.
   */
  endingStyle: CommonPopupDataAttributes.endingStyle,
} as const;
