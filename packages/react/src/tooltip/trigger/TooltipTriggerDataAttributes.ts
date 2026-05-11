import { CommonTriggerDataAttributes } from '../../utils/popupStateMapping';

export const TooltipTriggerDataAttributes = {
  /**
   * Present when the corresponding tooltip is open.
   */
  popupOpen: CommonTriggerDataAttributes.popupOpen,
  /**
   * Present when the trigger is disabled, either by the `disabled` prop or by a parent `<Tooltip.Root>` component.
   */
  triggerDisabled: 'data-trigger-disabled',
} as const;
