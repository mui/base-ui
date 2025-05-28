import { mergeDateAndTime, getTodayDate, createIsAfterIgnoreDatePart } from './date-helpers';
import { TemporalAdapter, TemporalTimezone, TemporalSupportedObject } from '../../models';

export const SECTION_TYPE_GRANULARITY = {
  year: 1,
  month: 2,
  day: 3,
  hours: 4,
  minutes: 5,
  seconds: 6,
  milliseconds: 7,
};

const roundDate = (
  adapter: TemporalAdapter,
  granularity: number,
  date: TemporalSupportedObject,
) => {
  if (granularity === SECTION_TYPE_GRANULARITY.year) {
    return adapter.startOfYear(date);
  }
  if (granularity === SECTION_TYPE_GRANULARITY.month) {
    return adapter.startOfMonth(date);
  }
  if (granularity === SECTION_TYPE_GRANULARITY.day) {
    return adapter.startOfDay(date);
  }

  // We don't have startOfHour / startOfMinute / startOfSecond
  let roundedDate = date;
  if (granularity < SECTION_TYPE_GRANULARITY.minutes) {
    roundedDate = adapter.setMinutes(roundedDate, 0);
  }
  if (granularity < SECTION_TYPE_GRANULARITY.seconds) {
    roundedDate = adapter.setSeconds(roundedDate, 0);
  }
  if (granularity < SECTION_TYPE_GRANULARITY.milliseconds) {
    roundedDate = adapter.setMilliseconds(roundedDate, 0);
  }

  return roundedDate;
};

export const getDefaultReferenceDate = (
  parameters: getDefaultReferenceDate.Parameters,
): TemporalSupportedObject => {
  const { props, adapter, granularity, timezone, getTodayDate: inGetTodayDate } = parameters;

  let referenceDate = inGetTodayDate
    ? inGetTodayDate()
    : roundDate(adapter, granularity, getTodayDate(adapter, timezone));

  if (props.minDate != null && adapter.isAfterDay(props.minDate, referenceDate)) {
    referenceDate = roundDate(adapter, granularity, props.minDate);
  }

  if (props.maxDate != null && adapter.isBeforeDay(props.maxDate, referenceDate)) {
    referenceDate = roundDate(adapter, granularity, props.maxDate);
  }

  const isAfter = createIsAfterIgnoreDatePart(
    props.disableIgnoringDatePartForTimeValidation ?? false,
    adapter,
  );
  if (props.minTime != null && isAfter(props.minTime, referenceDate)) {
    referenceDate = roundDate(
      adapter,
      granularity,
      props.disableIgnoringDatePartForTimeValidation
        ? props.minTime
        : mergeDateAndTime(adapter, referenceDate, props.minTime),
    );
  }

  if (props.maxTime != null && isAfter(referenceDate, props.maxTime)) {
    referenceDate = roundDate(
      adapter,
      granularity,
      props.disableIgnoringDatePartForTimeValidation
        ? props.maxTime
        : mergeDateAndTime(adapter, referenceDate, props.maxTime),
    );
  }

  return referenceDate;
};

export namespace getDefaultReferenceDate {
  export interface Parameters {
    props: Props;
    adapter: TemporalAdapter;
    granularity: number;
    timezone: TemporalTimezone;
    getTodayDate?: () => TemporalSupportedObject;
  }

  export interface Props {
    maxDate?: TemporalSupportedObject;
    minDate?: TemporalSupportedObject;
    minTime?: TemporalSupportedObject;
    maxTime?: TemporalSupportedObject;
    disableIgnoringDatePartForTimeValidation?: boolean;
  }
}
