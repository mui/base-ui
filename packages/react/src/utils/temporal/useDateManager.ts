'use client';
import * as React from 'react';
import { applyDefaultDate } from './date-helpers';
import { validateDate } from './validateDate';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalManager } from './types';
import { nonRangeTemporalValueManager } from './temporalValueManagers';
import { TemporalNonRangeValue, TemporalSupportedObject } from '../../models';

export function useDateManager(
  _parameters: useDateManager.Parameters = {},
): useDateManager.ReturnValue {
  return React.useMemo(
    () => ({
      valueType: 'date',
      validator: validateDate,
      internal_valueManager: nonRangeTemporalValueManager,
    }),
    [],
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
