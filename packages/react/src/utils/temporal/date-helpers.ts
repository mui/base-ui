import { TemporalAdapter, TemporalSupportedObject, TemporalTimezone } from '../../models';

export const getCurrentDate = (
  adapter: TemporalAdapter,
  timezone: TemporalTimezone,
  shouldRemoveTime: boolean,
): TemporalSupportedObject => {
  const today = adapter.date(undefined, timezone);

  if (shouldRemoveTime) {
    return adapter.startOfDay(today);
  }

  return today;
};

export const mergeDateAndTime = (
  adapter: TemporalAdapter,
  dateParam: TemporalSupportedObject,
  timeParam: TemporalSupportedObject,
): TemporalSupportedObject => {
  let mergedDate = dateParam;
  mergedDate = adapter.setHours(mergedDate, adapter.getHours(timeParam));
  mergedDate = adapter.setMinutes(mergedDate, adapter.getMinutes(timeParam));
  mergedDate = adapter.setSeconds(mergedDate, adapter.getSeconds(timeParam));
  mergedDate = adapter.setMilliseconds(mergedDate, adapter.getMilliseconds(timeParam));

  return mergedDate;
};

export const getSecondsInDay = (date: TemporalSupportedObject, adapter: TemporalAdapter) => {
  return adapter.getHours(date) * 3600 + adapter.getMinutes(date) * 60 + adapter.getSeconds(date);
};

export const createIsAfterIgnoreDatePart =
  (disableIgnoringDatePartForTimeValidation: boolean, adapter: TemporalAdapter) =>
  (dateLeft: TemporalSupportedObject, dateRight: TemporalSupportedObject) => {
    if (disableIgnoringDatePartForTimeValidation) {
      return adapter.isAfter(dateLeft, dateRight);
    }

    return getSecondsInDay(dateLeft, adapter) > getSecondsInDay(dateRight, adapter);
  };

export const areDatesEqual = (
  adapter: TemporalAdapter,
  a: TemporalSupportedObject | null,
  b: TemporalSupportedObject | null,
) => {
  if (!adapter.isValid(a) && a != null && !adapter.isValid(b) && b != null) {
    return true;
  }

  return adapter.isEqual(a, b);
};

export const replaceInvalidDateByNull = (
  adapter: TemporalAdapter,
  value: TemporalSupportedObject | null,
): TemporalSupportedObject | null => (adapter.isValid(value) ? value : null);

export const applyDefaultDate = (
  adapter: TemporalAdapter,
  date: TemporalSupportedObject | null | undefined,
  defaultDate: TemporalSupportedObject,
): TemporalSupportedObject => {
  if (date != null && adapter.isValid(date ?? null)) {
    return date;
  }

  return defaultDate;
};

export const getWeekdays = (
  adapter: TemporalAdapter,
  date: TemporalSupportedObject,
): TemporalSupportedObject[] => {
  const start = adapter.startOfWeek(date);
  return [0, 1, 2, 3, 4, 5, 6].map((diff) => adapter.addDays(start, diff));
};
