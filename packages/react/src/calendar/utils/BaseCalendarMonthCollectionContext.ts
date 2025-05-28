import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface SharedCalendarMonthCollectionContext {
  /**
   * Return true if the month should be reachable using tab navigation.
   * @param {TemporalSupportedObject} month The month to check.
   * @returns {boolean} Whether the month should be reachable using tab navigation.
   */
  canCellBeTabbed: (month: TemporalSupportedObject) => boolean;
}

export const SharedCalendarMonthCollectionContext = React.createContext<
  SharedCalendarMonthCollectionContext | undefined
>(undefined);

export function useSharedCalendarMonthCollectionContext() {
  const context = React.useContext(SharedCalendarMonthCollectionContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: SharedCalendarMonthCollectionContext is missing.',
        '<Calendar.MonthCell /> must be placed within <Calendar.MonthList /> or <Calendar.MonthGrid />.',
        '<RangeCalendar.MonthCell /> must be placed within <RangeCalendar.MonthList /> or <RangeCalendar/MonthGrid />.',
      ].join('\n'),
    );
  }
  return context;
}

export function useNullableSharedCalendarMonthCollectionContext() {
  return React.useContext(SharedCalendarMonthCollectionContext) ?? null;
}
