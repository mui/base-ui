import { mergeDateAndTime, getCurrentDate, createIsAfterIgnoreDatePart } from './date-helpers';
import { TemporalAdapter, TemporalTimezone, TemporalSupportedObject } from '../../models';

const roundDate = (
  adapter: TemporalAdapter,
  precision: getInitialReferenceDate.Precision,
  date: TemporalSupportedObject,
) => {
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
};

export const getInitialReferenceDate = (
  parameters: getInitialReferenceDate.Parameters,
): TemporalSupportedObject => {
  const {
    props,
    adapter,
    precision,
    controlledDate,
    referenceDate: inReferenceDate = null,
    timezone,
  } = parameters;

  if (adapter.isValid(controlledDate)) {
    return controlledDate;
  }

  if (adapter.isValid(inReferenceDate)) {
    return inReferenceDate;
  }

  let referenceDate = roundDate(adapter, precision, getCurrentDate(adapter, timezone, false));

  if (props.minDate != null && adapter.isAfter(props.minDate, referenceDate, 'day')) {
    referenceDate = roundDate(adapter, precision, props.minDate);
  }

  if (props.maxDate != null && adapter.isBefore(props.maxDate, referenceDate, 'day')) {
    referenceDate = roundDate(adapter, precision, props.maxDate);
  }

  const isAfter = createIsAfterIgnoreDatePart(
    props.disableIgnoringDatePartForTimeValidation ?? false,
    adapter,
  );
  if (props.minTime != null && isAfter(props.minTime, referenceDate)) {
    referenceDate = roundDate(
      adapter,
      precision,
      props.disableIgnoringDatePartForTimeValidation
        ? props.minTime
        : mergeDateAndTime(adapter, referenceDate, props.minTime),
    );
  }

  if (props.maxTime != null && isAfter(referenceDate, props.maxTime)) {
    referenceDate = roundDate(
      adapter,
      precision,
      props.disableIgnoringDatePartForTimeValidation
        ? props.maxTime
        : mergeDateAndTime(adapter, referenceDate, props.maxTime),
    );
  }

  return referenceDate;
};

export namespace getInitialReferenceDate {
  export interface Parameters {
    props: Props;
    adapter: TemporalAdapter;
    controlledDate: TemporalSupportedObject | null;
    referenceDate?: TemporalSupportedObject | undefined;
    precision: Precision;
    timezone: TemporalTimezone;
  }

  export interface Props {
    maxDate?: TemporalSupportedObject;
    minDate?: TemporalSupportedObject;
    minTime?: TemporalSupportedObject;
    maxTime?: TemporalSupportedObject;
    disableIgnoringDatePartForTimeValidation?: boolean;
  }

  export type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
}
