import {
  TemporalAdapter,
  TemporalTimezone,
  TemporalSupportedObject,
  TemporalFieldDatePartType,
} from '../../types';
import {
  isAfterDay,
  isBeforeDay,
  isTimePartAfter,
  isTimePartBefore,
  mergeDateAndTime,
} from './date-helpers';
import { ValidateDateValidationProps } from './validateDate';

function roundDate(
  adapter: TemporalAdapter,
  mostGranularPart: TemporalFieldDatePartType,
  date: TemporalSupportedObject,
) {
  switch (mostGranularPart) {
    case 'year':
      return adapter.startOfYear(date);
    case 'month':
      return adapter.startOfMonth(date);
    case 'day':
      return adapter.startOfDay(date);
    case 'hours':
      return adapter.startOfHour(date);
    case 'minutes':
      return adapter.startOfMinute(date);
    case 'seconds':
      return adapter.startOfSecond(date);
    default:
      return date;
  }
}

export function getInitialReferenceDate(
  parameters: GetInitialReferenceDateParameters,
): TemporalSupportedObject {
  const {
    adapter,
    timezone,
    granularity,
    externalDate,
    externalReferenceDate,
    validationProps: { minDate, maxDate },
  } = parameters;
  let referenceDate: TemporalSupportedObject | null = null;

  if (externalDate != null && adapter.isValid(externalDate)) {
    referenceDate = adapter.setTimezone(externalDate, timezone);
  } else if (externalReferenceDate != null && adapter.isValid(externalReferenceDate)) {
    referenceDate = adapter.setTimezone(externalReferenceDate, timezone);
  } else {
    referenceDate = roundDate(adapter, granularity, adapter.now(timezone));
    if (minDate != null && isBeforeDay(adapter, referenceDate, minDate)) {
      referenceDate = roundDate(adapter, granularity, minDate);
    }

    if (maxDate != null && isAfterDay(adapter, referenceDate, maxDate)) {
      referenceDate = roundDate(adapter, granularity, maxDate);
    }

    // Also adjust time portion if needed (for time-only or datetime fields)
    if (
      minDate != null &&
      adapter.isValid(minDate) &&
      isTimePartBefore(adapter, referenceDate, minDate)
    ) {
      referenceDate = roundDate(
        adapter,
        granularity,
        mergeDateAndTime(adapter, referenceDate, minDate),
      );
    }

    if (
      maxDate != null &&
      adapter.isValid(maxDate) &&
      isTimePartAfter(adapter, referenceDate, maxDate)
    ) {
      referenceDate = roundDate(
        adapter,
        granularity,
        mergeDateAndTime(adapter, referenceDate, maxDate),
      );
    }
  }

  return referenceDate;
}

export interface GetInitialReferenceDateParameters {
  /**
   * The adapter used to manipulate the date.
   */
  adapter: TemporalAdapter;
  /**
   * The date provided by the user, if any.
   * If the component is a range component, this will be the start date if defined or the end date otherwise.
   */
  externalDate: TemporalSupportedObject | null | undefined;
  /**
   * The reference date provided by the user, if any.
   */
  externalReferenceDate: TemporalSupportedObject | null | undefined;
  /**
   * The timezone the reference date should be in.
   */
  timezone: TemporalTimezone;
  /**
   * The props used to validate the date, time or date-time object.
   */
  validationProps: GetInitialReferenceDateValidationProps;
  /**
   * The most granular date part used in the component.
   */
  granularity: TemporalFieldDatePartType;
}

export type GetInitialReferenceDateValidationProps = ValidateDateValidationProps;
