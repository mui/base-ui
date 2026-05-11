import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export const ContextMenuTriggerDataAttributes = {
  /**
   * Present when the corresponding context menu is open.
   */
  popupOpen: CommonTriggerDataAttributes.popupOpen,
  /**
   * Present when the trigger is pressed.
   */
  pressed: CommonTriggerDataAttributes.pressed,
} as const;
