import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface SharedCalendarYearCollectionContext {
  /**
   * Return true if the year should be reachable using tab navigation.
   * @param {TemporalSupportedObject} year The year to check.
   * @returns {boolean} Whether the year should be reachable using tab navigation.
   */
  canCellBeTabbed: (year: TemporalSupportedObject) => boolean;
}

export const SharedCalendarYearCollectionContext = React.createContext<
  SharedCalendarYearCollectionContext | undefined
>(undefined);

export function useSharedCalendarYearCollectionContext() {
  const context = React.useContext(SharedCalendarYearCollectionContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: SharedCalendarYearCollectionContext is missing.',
        '<Calendar.YearCell /> must be placed within <Calendar.YearList /> or <Calendar.YearGrid />.',
        '<RangeCalendar.YearCell /> must be placed within <RangeCalendar.YearList /> or <RangeCalendar.YearGrid />.',
      ].join('\n'),
    );
  }
  return context;
}

export function useNullableSharedCalendarYearCollectionContext() {
  return React.useContext(SharedCalendarYearCollectionContext) ?? null;
}
