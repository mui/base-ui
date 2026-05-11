import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export const MenuSubmenuTriggerDataAttributes = {
  /**
   * Present when the corresponding submenu is open.
   */
  popupOpen: CommonTriggerDataAttributes.popupOpen,
  /**
   * Present when the submenu trigger is highlighted.
   */
  highlighted: 'data-highlighted',
  /**
   * Present when the submenu trigger is disabled.
   */
  disabled: 'data-disabled',
} as const;
