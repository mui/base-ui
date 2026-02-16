import { areDatesEqual } from './date-helpers';
import { validateDate, ValidateDateReturnValue, ValidateDateValidationProps } from './validateDate';
import { TemporalManager } from './types';
import { TemporalValue, TemporalAdapter } from '../../types';

export function getDateManager(adapter: TemporalAdapter): GetDateManagerReturnValue {
  return {
    dateType: 'date',
    emptyValue: null,
    emptyValidationError: null,
    areValuesEqual: (valueA, valueB) => areDatesEqual(adapter, valueA, valueB),
    getValidationError: (value, validationProps) =>
      validateDate({ adapter, value, validationProps }),
    areValidationErrorEquals: (errorA, errorB) => errorA === errorB,
    isValidationErrorEmpty: (error) => error == null,
    getTimezone: (value) => (adapter.isValid(value) ? adapter.getTimezone(value) : null),
    setTimezone: (value, timezone) => (value == null ? null : adapter.setTimezone(value, timezone)),
    getDatesFromValue: (value) => (value == null ? [] : [value]),
  };
}

export type GetDateManagerReturnValue = TemporalManager<
  TemporalValue,
  ValidateDateReturnValue,
  ValidateDateValidationProps
>;
