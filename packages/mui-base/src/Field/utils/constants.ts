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

export const STYLE_HOOK_MAPPING = {
  valid(value: boolean | null): Record<string, string> | null {
    if (value === null) {
      return null;
    }
    if (value) {
      return {
        'data-valid': '',
      };
    }
    return {
      'data-invalid': '',
    };
  },
};
