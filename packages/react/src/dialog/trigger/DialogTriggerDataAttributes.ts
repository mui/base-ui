import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export const DialogTriggerDataAttributes = {
  /**
   * Present when the trigger is disabled.
   */
  disabled: 'data-disabled',
  /**
   * Present when the corresponding dialog is open.
   */
  popupOpen: CommonTriggerDataAttributes.popupOpen,
} as const;
