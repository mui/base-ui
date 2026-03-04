import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export enum NavigationMenuTriggerLinkDataAttributes {
  /**
   * Present when the trigger link points to the currently active page.
   */
  active = 'data-active',
  /**
   * Present when the corresponding navigation menu is open.
   */
  popupOpen = CommonTriggerDataAttributes.popupOpen,
}
