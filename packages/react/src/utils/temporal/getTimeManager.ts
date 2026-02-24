import { areDatesEqual } from './date-helpers';
import { validateTime, ValidateTimeReturnValue } from './validateTime';
import { ValidateDateValidationProps } from './validateDate';
import { TemporalManager } from './types';
import { TemporalValue, TemporalAdapter } from '../../types';

export function getTimeManager(adapter: TemporalAdapter): GetTimeManagerReturnValue {
  return {
    dateType: 'time',
    emptyValue: null,
    emptyValidationError: null,
    areValuesEqual: (valueA, valueB) => areDatesEqual(adapter, valueA, valueB),
    getValidationError: (value, validationProps) =>
      validateTime({ adapter, value, validationProps }),
    areValidationErrorEquals: (errorA, errorB) => errorA === errorB,
    isValidationErrorEmpty: (error) => error == null,
    getTimezone: (value) => (adapter.isValid(value) ? adapter.getTimezone(value) : null),
    setTimezone: (value, timezone) => (value == null ? null : adapter.setTimezone(value, timezone)),
    getDatesFromValue: (value) => (value == null ? [] : [value]),
  };
}

export type GetTimeManagerReturnValue = TemporalManager<
  TemporalValue,
  ValidateTimeReturnValue,
  ValidateDateValidationProps
>;
