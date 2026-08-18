import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export enum PopoverTriggerDataAttributes {
  /**
   * Present when the corresponding popover is open.
   */
  popupOpen = CommonTriggerDataAttributes.popupOpen,
  /**
   * Present when the trigger is pressed.
   */
  pressed = CommonTriggerDataAttributes.pressed,
  /**
   * Present when the trigger is disabled.
   */
  disabled = 'data-disabled',
}
