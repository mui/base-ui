import type { BaseUIComponentProps } from '../../utils/types';

export interface FieldValidityData {
  state: {
    badInput: boolean;
    customError: boolean;
    patternMismatch: boolean;
    rangeOverflow: boolean;
    rangeUnderflow: boolean;
    stepMismatch: boolean;
    tooLong: boolean;
    tooShort: boolean;
    typeMismatch: boolean;
    valueMissing: boolean;
    valid: boolean | null;
  };
  error: string;
  errors: string[];
  value: unknown;
  initialValue: unknown;
}

export interface FieldRootOwnerState {
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean | null;
}

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {
  /**
   * Function to custom-validate the field's value. Return a string or array of strings with error
   * messages if the value is invalid, or `null` if the value is valid. The function can also return
   * a promise that resolves to a string, array of strings, or `null`.
   */
  validate?: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
  /**
   * Determines if validation should be triggered on the `change` event, rather than only on commit
   * (blur).
   * @default false
   */
  validateOnChange?: boolean;
  /**
   * The debounce time in milliseconds for the `validate` function in the `change` phase.
   * @default 0
   */
  validateDebounceTime?: number;
  /**
   * Determines if the field is forcefully marked as invalid.
   * @default false
   */
  invalid?: boolean;
}
