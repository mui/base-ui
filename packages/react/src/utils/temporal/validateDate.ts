import { TemporalValidator } from './useTemporalValidation';
import { TemporalNonRangeValue, TemporalSupportedObject } from '../../models';

export const validateDate: TemporalValidator<
  TemporalNonRangeValue,
  validateDate.Error,
  validateDate.ValidationProps
> = ({ validationProps, value, adapter }) => {
  if (value === null) {
    return null;
  }

  const { shouldDisableDate, minDate, maxDate } = validationProps;

  switch (true) {
    case !adapter.isValid(value):
      return 'invalidDate';

    case Boolean(shouldDisableDate && shouldDisableDate(value)):
      return 'shouldDisableDate';

    case Boolean(minDate && adapter.isBefore(value, minDate, 'day')):
      return 'minDate';

    case Boolean(maxDate && adapter.isAfter(value, maxDate, 'day')):
      return 'maxDate';

    default:
      return null;
  }
};

export namespace validateDate {
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
    /**
     * Disable specific date.
     *
     * Warning: This function can be called multiple times (for example when rendering date calendar, checking if focus can be moved to a certain date, etc.). Expensive computations can impact performance.
     *
     * @param {TemporalSupportedObject} day The date to test.
     * @returns {boolean} If `true` the date will be disabled.
     */
    shouldDisableDate?: (day: TemporalSupportedObject) => boolean;
  }
}
