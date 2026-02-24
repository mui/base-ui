import { TemporalAdapter, TemporalSupportedObject } from '../../types';

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

function getMillisecondsInDay(adapter: TemporalAdapter, date: TemporalSupportedObject) {
  return (
    adapter.getHours(date) * 3_600_000 +
    adapter.getMinutes(date) * 60_000 +
    adapter.getSeconds(date) * 1_000 +
    adapter.getMilliseconds(date)
  );
}

/**
 * Check if the time part of the first date is after the time part of the second date.
 */
export function isTimePartAfter(
  adapter: TemporalAdapter,
  dateA: TemporalSupportedObject,
  dateB: TemporalSupportedObject,
): boolean {
  return getMillisecondsInDay(adapter, dateA) > getMillisecondsInDay(adapter, dateB);
}

/**
 * Check if the time part of the first date is before the time part of the second date.
 */
export function isTimePartBefore(
  adapter: TemporalAdapter,
  dateA: TemporalSupportedObject,
  dateB: TemporalSupportedObject,
): boolean {
  return getMillisecondsInDay(adapter, dateA) < getMillisecondsInDay(adapter, dateB);
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
