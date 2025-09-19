import { TemporalAdapter, TemporalNonRangeValue, TemporalSupportedObject } from '../../models';
import { isAfterDay, isBeforeDay } from './date-helpers';

export function validateDate(parameters: validateDate.Parameters): validateDate.ReturnValue {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }
  if (minDate != null && isBeforeDay(adapter, value, minDate)) {
    return 'before-min-date';
  }
  if (maxDate != null && isAfterDay(adapter, value, maxDate)) {
    return 'after-max-date';
  }
  return null;
}

export namespace validateDate {
  export interface Parameters {
    /**
     * The adapter used to manipulate the date.
     */
    adapter: TemporalAdapter;
    /**
     * The value to validate.
     */
    value: TemporalNonRangeValue;
    /**
     * The props used to validate a date.
     */
    validationProps: ValidationProps;
  }

  export type ReturnValue = 'invalid' | 'before-min-date' | 'after-max-date' | null;

  export interface ValidationProps {
    /**
     * Minimal selectable date.
     */
    minDate?: TemporalSupportedObject;
    /**
     * Maximal selectable date.
     */
    maxDate?: TemporalSupportedObject;
  }
}
