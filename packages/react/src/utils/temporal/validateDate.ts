import { TemporalAdapter, TemporalNonRangeValue, TemporalSupportedObject } from '../../models';

export function validateDate(parameters: validateDate.Parameters): validateDate.Error {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }
  if (minDate != null && adapter.isBefore(value, minDate, 'day')) {
    return 'before-min-date';
  }
  if (maxDate != null && adapter.isAfter(value, maxDate, 'day')) {
    return 'after-max-date';
  }
  return null;
}

export namespace validateDate {
  export interface Parameters {
    adapter: TemporalAdapter;
    value: TemporalNonRangeValue;
    validationProps: ValidationProps;
  }

  /**
   * The error the validateDate method can return.
   */
  export type Error = 'invalid' | 'unavailable' | 'before-min-date' | 'after-max-date' | null;

  export interface ValidationProps {
    /**
     * Maximal selectable date.
     * @default 2099-12-31
     */
    maxDate: TemporalSupportedObject;
    /**
     * Minimal selectable date.
     * @default 1900-01-01
     */
    minDate: TemporalSupportedObject;
  }
}
