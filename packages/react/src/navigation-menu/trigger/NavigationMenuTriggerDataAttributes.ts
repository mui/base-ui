import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export enum NavigationMenuTriggerDataAttributes {
  /**
   * Present when the corresponding navigation menu is open.
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
