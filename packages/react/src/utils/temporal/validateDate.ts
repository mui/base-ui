import { TemporalAdapter, TemporalValue, TemporalSupportedObject } from '../../types';
import { isAfterDay, isBeforeDay } from './date-helpers';

export function validateDate(parameters: ValidateDateParameters): ValidateDateReturnValue {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }
  if (minDate != null && adapter.isValid(minDate) && isBeforeDay(adapter, value, minDate)) {
    return 'before-min-date';
  }
  if (maxDate != null && adapter.isValid(maxDate) && isAfterDay(adapter, value, maxDate)) {
    return 'after-max-date';
  }
  return null;
}

export interface ValidateDateParameters {
  /**
   * The adapter used to manipulate the date.
   */
  adapter: TemporalAdapter;
  /**
   * The value to validate.
   */
  value: TemporalValue;
  /**
   * The props used to validate a date.
   */
  validationProps: ValidateDateValidationProps;
}

export interface ValidateDateValidationProps {
  /**
   * Minimal selectable date.
   */
  minDate?: TemporalSupportedObject | undefined;
  /**
   * Maximal selectable date.
   */
  maxDate?: TemporalSupportedObject | undefined;
}

export type ValidateDateReturnValue = 'invalid' | 'before-min-date' | 'after-max-date' | null;
