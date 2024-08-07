import type { BaseUIComponentProps } from '../../utils/types';

export type RadioGroupRootOwnerState = {
  disabled: boolean | undefined;
};

export interface RadioGroupRootProps extends BaseUIComponentProps<'div', RadioGroupRootOwnerState> {
  /**
   * Whether the radio group is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The name of the radio group submitted with the form data.
   */
  name?: string;
  /**
   * The value of the selected radio button. Use when controlled.
   */
  value?: string;
  /**
   * The default value of the selected radio button. Use when uncontrolled.
   */
  defaultValue?: string;
  /**
   * Callback fired when the value changes.
   */
  onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * The orientation of the radio group.
   */
  orientation?: 'horizontal' | 'vertical';
}
