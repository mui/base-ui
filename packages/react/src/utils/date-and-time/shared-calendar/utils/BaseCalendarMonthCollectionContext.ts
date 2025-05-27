import * as React from 'react';
import { PickerValidDate } from '../../../../../models';

export interface BaseCalendarMonthCollectionContext {
  /**
   * Return true if the month should be reachable using tab navigation.
   * @param {PickerValidDate} month The month to check.
   * @returns {boolean} Whether the month should be reachable using tab navigation.
   */
  canCellBeTabbed: (month: PickerValidDate) => boolean;
}

export const BaseCalendarMonthCollectionContext = React.createContext<
  BaseCalendarMonthCollectionContext | undefined
>(undefined);

if (process.env.NODE_ENV !== 'production') {
  BaseCalendarMonthCollectionContext.displayName = 'BaseCalendarMonthCollectionContext';
}

export function useBaseCalendarMonthCollectionContext() {
  const context = React.useContext(BaseCalendarMonthCollectionContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI X: BaseCalendarMonthCollectionContext is missing.',
        '<Calendar.MonthCell /> must be placed within <Calendar.MonthList /> or <Calendar.MonthGrid />.',
        '<RangeCalendar.MonthCell /> must be placed within <RangeCalendar.MonthList /> or <RangeCalendar/MonthGrid />.',
      ].join('\n'),
    );
  }
  return context;
}

export function useNullableBaseCalendarMonthCollectionContext() {
  return React.useContext(BaseCalendarMonthCollectionContext) ?? null;
}
