import { FieldControlDataAttributes } from '../control/FieldControlDataAttributes';
import type { FieldRootState } from '../root/FieldRoot';

export const DEFAULT_VALIDITY_STATE = {
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: null,
  valueMissing: false,
};

export const DEFAULT_FIELD_ROOT_STATE: FieldRootState = {
  disabled: false,
  valid: null,
  touched: false,
  dirty: false,
  filled: false,
  focused: false,
};

export const DEFAULT_FIELD_STATE_ATTRIBUTES: Pick<
  FieldRootState,
  'valid' | 'touched' | 'dirty' | 'filled' | 'focused'
> = {
  valid: DEFAULT_FIELD_ROOT_STATE.valid,
  touched: DEFAULT_FIELD_ROOT_STATE.touched,
  dirty: DEFAULT_FIELD_ROOT_STATE.dirty,
  filled: DEFAULT_FIELD_ROOT_STATE.filled,
  focused: DEFAULT_FIELD_ROOT_STATE.focused,
};

export const fieldValidityMapping = {
  valid(value: boolean | null): Record<string, string> | null {
    if (value === null) {
      return null;
    }
    if (value) {
      return {
        [FieldControlDataAttributes.valid]: '',
      };
    }
    return {
      [FieldControlDataAttributes.invalid]: '',
    };
  },
};
