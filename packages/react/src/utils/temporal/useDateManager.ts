'use client';
import * as React from 'react';
import { applyDefaultDate, areDatesEqual } from './date-helpers';
import { validateDate } from './validateDate';
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
    validateDate.Error,
    validateDate.ValidationProps
  >;
}

export function useApplyDefaultValuesToDateValidationProps(
  props: Partial<validateDate.ValidationProps>,
): validateDate.ValidationProps {
  const adapter = useTemporalAdapter();

  // TODO: Decide what we want to do with the default min and max dates.
  return React.useMemo(
    () => ({
      minDate: applyDefaultDate(adapter, props.minDate, adapter.date('1900-01-01T00:00:00.000')),
      maxDate: applyDefaultDate(adapter, props.maxDate, adapter.date('2099-12-31T00:00:00.000')),
    }),
    [adapter, props.minDate, props.maxDate],
  );
}
