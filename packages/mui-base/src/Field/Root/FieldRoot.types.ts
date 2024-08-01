import type { BaseUIComponentProps } from '../../utils/types';

export interface ValidityData {
  state: ValidityState;
  error: string;
  errors: string[];
  value: unknown;
}

export type FieldRootOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {
  /**
   * Function to custom-validate the field's value. Return a string with an error message if the
   * value is invalid, or `null` if the value is valid. The function can also return a promise that
   * resolves to a string or `null`.
   */
  validate?: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
  /**
   * Determines if the validation should be triggered on the `change` event, rather than only on
   * commit (blur).
   * @default false
   */
  validateOnChange?: boolean;
  /**
   * The debounce time in milliseconds for the validation function for the `change` phase.
   * @default 0
   */
  validateDebounceMs?: number;
}
