import { TemporalAdapter, TemporalValue } from '../../types';
import { ValidateDateValidationProps, ValidateDateReturnValue } from './validateDate';

export function validateDateTime(
  parameters: ValidateDateTimeParameters,
): ValidateDateTimeReturnValue {
  const { adapter, value, validationProps } = parameters;

  if (value === null) {
    return null;
  }

  const { minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }

  if (minDate != null && adapter.isValid(minDate) && adapter.isBefore(value, minDate)) {
    return 'before-min-date';
  }

  if (maxDate != null && adapter.isValid(maxDate) && adapter.isAfter(value, maxDate)) {
    return 'after-max-date';
  }

  return null;
}

export interface ValidateDateTimeParameters {
  /**
   * The adapter used to manipulate the date/time.
   */
  adapter: TemporalAdapter;
  /**
   * The value to validate.
   */
  value: TemporalValue;
  /**
   * The props used to validate a date-time.
   */
  validationProps: ValidateDateValidationProps;
}

export type ValidateDateTimeReturnValue = ValidateDateReturnValue;
