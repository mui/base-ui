import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

export const DialogBackdropDataAttributes = {
  /**
   * Present when the dialog is open.
   */
  open: CommonPopupDataAttributes.open,
  /**
   * Present when the dialog is closed.
   */
  closed: CommonPopupDataAttributes.closed,
  /**
   * Present when the dialog is animating in.
   */
  startingStyle: CommonPopupDataAttributes.startingStyle,
  /**
   * Present when the dialog is animating out.
   */
  endingStyle: CommonPopupDataAttributes.endingStyle,
} as const;
