import {
  mergeDateAndTime,
  getCurrentDate,
  isTimePartAfter,
  isAfterDay,
  isBeforeDay,
} from './date-helpers';
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
    externalDate: controlledDate,
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
  if (minDate != null && isAfterDay(adapter, minDate, referenceDate)) {
    referenceDate = roundDate(adapter, precision, minDate);
  }
  if (maxDate != null && isBeforeDay(adapter, maxDate, referenceDate)) {
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
    /**
     * The adapter used to manipulate the date.
     */
    adapter: TemporalAdapter;
    /**
     * The date provided by the user, if any.
     * If the component is a range component, this will be the start date if defined or the end date otherwise.
     */
    externalDate: TemporalSupportedObject | null;
    /**
     * The reference date provided by the user, if any.
     */
    referenceDate?: TemporalSupportedObject | undefined;
    /**
     * The precision of the reference date to create.
     * For example, a Calendar will use "day" but a Time Field with the format "hh:mm" will use "minute".
     */
    precision: Precision;
    /**
     * The timezone the reference date should be in.
     */
    timezone: TemporalTimezone;
    /**
     * The props used to validate the date, time or date-time object.
     */
    validationProps: ValidationProps;
  }

  export interface ValidationProps {
    maxDate?: TemporalSupportedObject | null;
    minDate?: TemporalSupportedObject | null;
    minTime?: TemporalSupportedObject | null;
    maxTime?: TemporalSupportedObject | null;
  }

  export type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
}
