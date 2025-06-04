import {
  TemporalAdapter,
  TemporalNonRangeValue,
  TemporalSupportedObject,
  TemporalTimezone,
} from '../../models';

export function getCurrentDate(
  adapter: TemporalAdapter,
  timezone: TemporalTimezone,
  shouldRemoveTime: boolean,
): TemporalSupportedObject {
  const today = adapter.now(timezone);

  if (shouldRemoveTime) {
    return adapter.startOfDay(today);
  }

  return today;
}

export function mergeDateAndTime(
  adapter: TemporalAdapter,
  dateParam: TemporalSupportedObject,
  timeParam: TemporalSupportedObject,
): TemporalSupportedObject {
  let mergedDate = dateParam;
  mergedDate = adapter.setHours(mergedDate, adapter.getHours(timeParam));
  mergedDate = adapter.setMinutes(mergedDate, adapter.getMinutes(timeParam));
  mergedDate = adapter.setSeconds(mergedDate, adapter.getSeconds(timeParam));
  mergedDate = adapter.setMilliseconds(mergedDate, adapter.getMilliseconds(timeParam));

  return mergedDate;
}

/**
 * Check if the time part of the first date is after the time part of the second date.
 */
export function isTimePartAfter(
  adapter: TemporalAdapter,
  dateA: TemporalSupportedObject,
  dateB: TemporalSupportedObject,
): boolean {
  const getSecondsInDay = (date: TemporalSupportedObject) => {
    return adapter.getHours(date) * 3600 + adapter.getMinutes(date) * 60 + adapter.getSeconds(date);
  };

  return getSecondsInDay(dateA) > getSecondsInDay(dateB);
}

export function areDatesEqual(
  adapter: TemporalAdapter,
  a: TemporalSupportedObject | null,
  b: TemporalSupportedObject | null,
) {
  if (!adapter.isValid(a) && a != null && !adapter.isValid(b) && b != null) {
    return true;
  }

  return adapter.isEqual(a, b);
}

export function replaceInvalidDateByNull(
  adapter: TemporalAdapter,
  value: TemporalSupportedObject | null,
): TemporalSupportedObject | null {
  if (adapter.isValid(value)) {
    return value;
  }
  return null;
}

export function validateDate(parameters: validateDate.Parameters): validateDate.ReturnValue {
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
