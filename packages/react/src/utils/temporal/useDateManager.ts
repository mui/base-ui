'use client';
import * as React from 'react';
import { applyDefaultDate } from './date-helpers';
import { validateDate } from './validateDate';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalManager } from './types';
import { TemporalNonRangeValue, TemporalSupportedObject } from '../../models';

export function useDateManager(
  _parameters: useDateManager.Parameters = {},
): useDateManager.ReturnValue {
  const adapter = useTemporalAdapter();

  return React.useMemo(
    () => ({
      valueType: 'date',
      emptyValue: null,
      emptyError: null,
      getError: (value, validationProps) => validateDate({ adapter, value, validationProps }),
      areErrorEquals: (errorA, errorB) => errorA === errorB,
      isErrorEmpty: (error) => error != null,
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

type SharedDateAndDateRangeValidationProps = 'minDate' | 'maxDate';

export function useApplyDefaultValuesToDateValidationProps(props: {
  minDate?: TemporalSupportedObject | null;
  maxDate?: TemporalSupportedObject | null;
}): Pick<validateDate.ValidationProps, SharedDateAndDateRangeValidationProps> {
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
