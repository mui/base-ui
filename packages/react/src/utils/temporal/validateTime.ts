import { TemporalAdapter, TemporalValue, TemporalSupportedObject } from '../../types';

export function validateTime(parameters: ValidateTimeParameters): ValidateTimeReturnValue {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { minTime, maxTime } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }

  if (minTime != null) {
    if (adapter.isValid(minTime) && adapter.isBefore(value, minTime)) {
      return 'before-min-time';
    }
  }

  if (maxTime != null) {
    if (adapter.isValid(maxTime) && adapter.isAfter(value, maxTime)) {
      return 'after-max-time';
    }
  }

  return null;
}

export interface ValidateTimeParameters {
  /**
   * The adapter used to manipulate the date/time.
   */
  adapter: TemporalAdapter;
  /**
   * The value to validate.
   */
  value: TemporalValue;
  /**
   * The props used to validate a time.
   */
  validationProps: ValidateTimeValidationProps;
}

export interface ValidateTimeValidationProps {
  /**
   * Minimal selectable time.
   */
  minTime?: TemporalSupportedObject | undefined;
  /**
   * Maximal selectable time.
   */
  maxTime?: TemporalSupportedObject | undefined;
}

export type ValidateTimeReturnValue = 'invalid' | 'before-min-time' | 'after-max-time' | null;
