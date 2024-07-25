import type { BaseUIComponentProps } from '../../utils/types';

export type RadioGroupItemOwnerState = {
  disabled: boolean;
  checked: boolean;
};

export interface RadioGroupItemProps
  extends Omit<BaseUIComponentProps<'button', RadioGroupItemOwnerState>, 'value'> {
  /**
   * The unique identifying name of the radio button in the group.
   */
  name: string;
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
