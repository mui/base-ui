import { TemporalAdapter, TemporalTimezone, TemporalSupportedObject } from '../../types';
import { isAfterDay, isBeforeDay } from './date-helpers';
import { ValidateDateValidationProps } from './validateDate';

export function getInitialReferenceDate(
  parameters: GetInitialReferenceDateParameters,
): TemporalSupportedObject {
  const {
    adapter,
    timezone,
    externalDate,
    externalReferenceDate,
    validationProps: { minDate, maxDate },
  } = parameters;
  let referenceDate: TemporalSupportedObject | null = null;

  if (adapter.isValid(externalDate)) {
    referenceDate = externalDate;
  } else if (adapter.isValid(externalReferenceDate)) {
    referenceDate = externalReferenceDate;
  } else {
    referenceDate = adapter.startOfDay(adapter.now(timezone));
    if (minDate != null && isBeforeDay(adapter, referenceDate, minDate)) {
      referenceDate = minDate;
    }
    if (maxDate != null && isAfterDay(adapter, referenceDate, maxDate)) {
      referenceDate = maxDate;
    }
  }

  return adapter.setTimezone(referenceDate, timezone);
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
  externalDate: TemporalSupportedObject | null;
  /**
   * The reference date provided by the user, if any.
   */
  externalReferenceDate: TemporalSupportedObject | null;
  /**
   * The timezone the reference date should be in.
   */
  timezone: TemporalTimezone;
  /**
   * The props used to validate the date, time or date-time object.
   */
  validationProps: GetInitialReferenceDateValidationProps;
}

export interface GetInitialReferenceDateValidationProps extends ValidateDateValidationProps {}
