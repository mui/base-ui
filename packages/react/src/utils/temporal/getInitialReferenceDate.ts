import { mergeDateAndTime, getCurrentDate, isTimePartAfter } from './date-helpers';
import { TemporalAdapter, TemporalTimezone, TemporalSupportedObject } from '../../models';

function roundDate(
  adapter: TemporalAdapter,
  precision: getInitialReferenceDate.Precision,
  date: TemporalSupportedObject,
): TemporalSupportedObject {
  switch (precision) {
    case 'year':
      return adapter.startOfYear(date);
    case 'month':
      return adapter.startOfMonth(date);
    case 'day':
      return adapter.startOfDay(date);
    case 'hour':
      return adapter.startOfHour(date);
    case 'minute':
      return adapter.startOfMinute(date);
    case 'second':
      return adapter.startOfSecond(date);
    default:
      return date;
  }
}

export function getInitialReferenceDate(
  parameters: getInitialReferenceDate.Parameters,
): TemporalSupportedObject {
  const {
    adapter,
    timezone,
    precision,
    controlledDate,
    referenceDate: inReferenceDate = null,
    validationProps: { minDate, maxDate, minTime, maxTime },
  } = parameters;

  if (adapter.isValid(controlledDate)) {
    return controlledDate;
  }

  if (adapter.isValid(inReferenceDate)) {
    return inReferenceDate;
  }

  let referenceDate = roundDate(adapter, precision, getCurrentDate(adapter, timezone, false));
  if (minDate != null && adapter.isAfter(minDate, referenceDate, 'day')) {
    referenceDate = roundDate(adapter, precision, minDate);
  }
  if (maxDate != null && adapter.isBefore(maxDate, referenceDate, 'day')) {
    referenceDate = roundDate(adapter, precision, maxDate);
  }

  if (minTime != null && isTimePartAfter(adapter, minTime, referenceDate)) {
    referenceDate = roundDate(
      adapter,
      precision,
      mergeDateAndTime(adapter, referenceDate, minTime),
    );
  }

  if (maxTime != null && isTimePartAfter(adapter, referenceDate, maxTime)) {
    referenceDate = roundDate(
      adapter,
      precision,
      mergeDateAndTime(adapter, referenceDate, maxTime),
    );
  }

  return referenceDate;
}

export namespace getInitialReferenceDate {
  export interface Parameters {
    validationProps: ValidationProps;
    adapter: TemporalAdapter;
    controlledDate: TemporalSupportedObject | null;
    referenceDate?: TemporalSupportedObject | undefined;
    precision: Precision;
    timezone: TemporalTimezone;
  }

  export interface ValidationProps {
    maxDate?: TemporalSupportedObject;
    minDate?: TemporalSupportedObject;
    minTime?: TemporalSupportedObject;
    maxTime?: TemporalSupportedObject;
  }

  export type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
}
