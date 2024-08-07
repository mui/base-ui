import type { BaseUIComponentProps } from '../../utils/types';

export type RadioGroupRootOwnerState = {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
};

export interface RadioGroupRootProps
  extends Omit<BaseUIComponentProps<'div', RadioGroupRootOwnerState>, 'value' | 'defaultValue'> {
  /**
   * Determines if the radio group is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Determines if the radio group is readonly.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Determines if the radio group is required.
   * @default false
   */
  required?: boolean;
  /**
   * The name of the radio group submitted with the form data.
   */
  name?: string;
  /**
   * The value of the selected radio button. Use when controlled.
   */
  value?: unknown;
  /**
   * The default value of the selected radio button. Use when uncontrolled.
   */
  defaultValue?: unknown;
  /**
   * Callback fired when the value changes.
   */
  onValueChange?: (value: unknown, event: React.ChangeEvent<HTMLInputElement>) => void;
}
