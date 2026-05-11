import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export const PopoverTriggerDataAttributes = {
  /**
   * Present when the corresponding popover is open.
   */
  popupOpen: CommonTriggerDataAttributes.popupOpen,
  /**
   * Present when the trigger is pressed.
   */
  pressed: CommonTriggerDataAttributes.pressed,
} as const;
