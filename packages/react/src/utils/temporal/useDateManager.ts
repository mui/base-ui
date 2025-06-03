'use client';
import * as React from 'react';
import { applyDefaultDate, areDatesEqual } from './date-helpers';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalManager } from './types';
import { TemporalAdapter, TemporalNonRangeValue, TemporalSupportedObject } from '../../models';

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

  export type ReturnValue = TemporalManager<TemporalNonRangeValue, Error, ValidationProps>;

  /**
   * The validation error a date can be in.
   */
  export type Error = 'invalid' | 'unavailable' | 'before-min-date' | 'after-max-date' | null;

  /**
   * The props used to validate a date.
   */
  export interface ValidationProps {
    /**
     * Minimal selectable date.
     * @default 1900-01-01
     */
    minDate: TemporalSupportedObject | null;
    /**
     * Maximal selectable date.
     * @default 2099-12-31
     */
    maxDate: TemporalSupportedObject | null;
  }
}

export function useApplyDefaultValuesToDateValidationProps(
  parameters: useApplyDefaultValuesToDateValidationProps.Parameters,
): useApplyDefaultValuesToDateValidationProps.ReturnValue {
  const adapter = useTemporalAdapter();

  // TODO: Decide what we want to do with the default min and max dates.
  return React.useMemo(
    () => ({
      minDate: applyDefaultDate(
        adapter,
        parameters.minDate,
        adapter.date('1900-01-01T00:00:00.000', 'default'),
      ),
      maxDate: applyDefaultDate(
        adapter,
        parameters.maxDate,
        adapter.date('2099-12-31T00:00:00.000', 'default'),
      ),
    }),
    [adapter, parameters.minDate, parameters.maxDate],
  );
}

export namespace useApplyDefaultValuesToDateValidationProps {
  export interface Parameters extends Partial<useDateManager.ValidationProps> {}

  export interface ReturnValue extends useDateManager.ValidationProps {}
}

export function validateDate(parameters: validateDate.Parameters): useDateManager.Error {
  const { adapter, value, validationProps } = parameters;
  if (value === null) {
    return null;
  }

  const { minDate, maxDate } = validationProps;

  if (!adapter.isValid(value)) {
    return 'invalid';
  }
  if (minDate != null && adapter.isBefore(value, minDate, 'day')) {
    return 'before-min-date';
  }
  if (maxDate != null && adapter.isAfter(value, maxDate, 'day')) {
    return 'after-max-date';
  }
  return null;
}

export namespace validateDate {
  export interface Parameters {
    /**
     * The adapter used to manipulate the date.
     */
    adapter: TemporalAdapter;
    /**
     * The value to validate.
     */
    value: TemporalNonRangeValue;
    /**
     * The props used to validate a date.
     */
    validationProps: useDateManager.ValidationProps;
  }
}
