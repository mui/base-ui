import { TemporalAdapter, TemporalSupportedObject, TemporalTimezone } from '../../types';

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

/**
 * Check if the day of the date A is after the day of the date B.
 * Uses timezone of the date A.
 */
export function isAfterDay(
  adapter: TemporalAdapter,
  dateA: TemporalSupportedObject,
  dateB: TemporalSupportedObject,
): boolean {
  const dateBWithCorrectTimezone = adapter.setTimezone(dateB, adapter.getTimezone(dateA));
  return adapter.isAfter(dateA, adapter.endOfDay(dateBWithCorrectTimezone));
}

/**
 * Check if the day of the date A is before the day of the date B.
 * Uses timezone of the date A.
 */
export function isBeforeDay(
  adapter: TemporalAdapter,
  dateA: TemporalSupportedObject,
  dateB: TemporalSupportedObject,
): boolean {
  const dateBWithCorrectTimezone = adapter.setTimezone(dateB, adapter.getTimezone(dateA));
  return adapter.isBefore(dateA, adapter.startOfDay(dateBWithCorrectTimezone));
}

export function formatMonthFullLetterAndYear(
  adapter: TemporalAdapter,
  date: TemporalSupportedObject,
) {
  const f = adapter.formats;
  const dateFormat = `${f.monthFullLetter} ${f.yearPadded}`;

  return adapter.formatByString(date, dateFormat);
}
