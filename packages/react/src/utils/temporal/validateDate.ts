import { TemporalAdapter, TemporalNonRangeValue, TemporalSupportedObject } from '../../models';

export function validateDate(parameters: validateDate.Parameters): validateDate.Error {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { shouldDisableDate, minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalidDate';
  }
  if (shouldDisableDate?.(value)) {
    return 'shouldDisableDate';
  }
  if (minDate != null && adapter.isBefore(value, minDate, 'day')) {
    return 'minDate';
  }
  if (maxDate != null && adapter.isAfter(value, maxDate, 'day')) {
    return 'maxDate';
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
  export type Error = 'invalidDate' | 'shouldDisableDate' | 'minDate' | 'maxDate' | null;

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
    // TODO:  Consider another API for disabling specific dates.
    /**
     * Disable specific date.
     *
     * Warning: This function can be called multiple times (for example when rendering date calendar, checking if focus can be moved to a certain date, etc.). Expensive computations can impact performance.
     */
    shouldDisableDate?: (day: TemporalSupportedObject) => boolean;
  }
}
