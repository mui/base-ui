import type { BaseUIComponentProps } from '../../utils/types';

export type RadioGroupItemOwnerState = {
  disabled: boolean;
  checked: boolean;
};

export interface RadioGroupItemProps
  extends BaseUIComponentProps<'button', RadioGroupItemOwnerState> {
  /**
   * The value of the item identified in the radio group.
   */
  value: string;
  /**
   * Determines if the item is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Determines if the item is required.
   * @default false
   */
  required?: boolean;
  /**
   * Determines if the item is readonly.
   * @default false
   */
  readOnly?: boolean;
}
