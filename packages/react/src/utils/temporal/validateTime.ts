import { TemporalAdapter, TemporalValue } from '../../types';
import { isTimePartAfter, isTimePartBefore } from './date-helpers';
import { ValidateDateValidationProps } from './validateDate';

export function validateTime(parameters: ValidateTimeParameters): ValidateTimeReturnValue {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }

  if (minDate != null && adapter.isValid(minDate) && isTimePartBefore(adapter, value, minDate)) {
    return 'before-min-time';
  }

  if (maxDate != null && adapter.isValid(maxDate) && isTimePartAfter(adapter, value, maxDate)) {
    return 'after-max-time';
  }

  return null;
}

export interface ValidateTimeParameters {
  /**
   * The adapter used to manipulate the date/time.
   */
  adapter: TemporalAdapter;
  /**
   * The value to validate.
   */
  value: TemporalValue;
  /**
   * The props used to validate a time.
   */
  validationProps: ValidateDateValidationProps;
}

export type ValidateTimeReturnValue = 'invalid' | 'before-min-time' | 'after-max-time' | null;
