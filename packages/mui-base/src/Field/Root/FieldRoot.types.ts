import type { BaseUIComponentProps } from '../../utils/types';

export interface ValidityData {
  state: ValidityState;
  message: string;
  value: unknown;
}

export type FieldRootOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {
  /**
   * The field's name, used to identify the field's control in the form.
   */
  name?: string;
  /**
   * Whether the field is disabled, adding a disabled style hook to all subcomponents as well as
   * disabling the interactive control inside.
   * @default false
   */
  disabled?: boolean;
  /**
   * Function to custom-validate the field's value.
   */
  validate?: (value: unknown) => string | null | Promise<string | null>;
}
