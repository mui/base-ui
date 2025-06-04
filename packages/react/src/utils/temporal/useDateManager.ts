'use client';
import * as React from 'react';
import { areDatesEqual, validateDate } from './date-helpers';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalManager } from './types';
import { TemporalNonRangeValue } from '../../models';

export function useDateManager(
  _parameters: useDateManager.Parameters = {},
): useDateManager.ReturnValue {
  const adapter = useTemporalAdapter();

  return React.useMemo(
    () => ({
      valueType: 'date',
      emptyValue: null,
      emptyValidationError: null,
      areValuesEqual: (valueA, valueB) => areDatesEqual(adapter, valueA, valueB),
      getValidationError: (value, validationProps) =>
        validateDate({ adapter, value, validationProps }),
      areValidationErrorEquals: (errorA, errorB) => errorA === errorB,
      isValidationErrorEmpty: (error) => error != null,
      getTimezone: (value) => (adapter.isValid(value) ? adapter.getTimezone(value) : null),
      setTimezone: (value, timezone) =>
        value == null ? null : adapter.setTimezone(value, timezone),
    }),
    [adapter],
  );
}

export namespace useDateManager {
  export interface Parameters {}

  export type ReturnValue = TemporalManager<
    TemporalNonRangeValue,
    validateDate.ReturnValue,
    validateDate.ValidationProps
  >;
}
