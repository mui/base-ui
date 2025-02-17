import { FieldControlDataAttributes } from '../control/FieldControlDataAttributes';

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
