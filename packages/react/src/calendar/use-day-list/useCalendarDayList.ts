import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../types/temporal';
import { getDayList } from './getDayList';

export function useCalendarDayList(): UseCalendarDayListReturnValue {
  const adapter = useTemporalAdapter();

  return React.useCallback((params) => getDayList(adapter, params), [adapter]);
}

export type UseCalendarDayListReturnValue = (parameters: {
  /**
   * The date to get the weeks in month for.
   */
  date: TemporalSupportedObject;
  /**
   * The amount of days to return.
   */
  amount: number;
}) => TemporalSupportedObject[];
