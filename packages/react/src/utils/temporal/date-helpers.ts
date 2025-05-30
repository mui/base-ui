import { TemporalAdapter, TemporalSupportedObject, TemporalTimezone } from '../../models';

export function getCurrentDate(
  adapter: TemporalAdapter,
  timezone: TemporalTimezone,
  shouldRemoveTime: boolean,
): TemporalSupportedObject {
  const today = adapter.date(undefined, timezone);

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

export function applyDefaultDate(
  adapter: TemporalAdapter,
  date: TemporalSupportedObject | null | undefined,
  defaultDate: TemporalSupportedObject,
): TemporalSupportedObject {
  if (adapter.isValid(date ?? null)) {
    return date!;
  }

  return defaultDate;
}
