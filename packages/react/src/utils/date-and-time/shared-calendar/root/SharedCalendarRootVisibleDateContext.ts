import * as React from 'react';
import { PickerValidDate } from '../../../../../models';

export interface BaseCalendarRootVisibleDateContext {
  /**
   * The date currently visible.
   * It is used to determine:
   * - which month to render in Calendar.DayGrid and RangeCalendar.DayGrid
   * - which year to render in Calendar.YearGrid, Calendar.YearList, RangeCalendar.YearGrid, and RangeCalendar.YearList
   */
  visibleDate: PickerValidDate;
}

export const BaseCalendarRootVisibleDateContext = React.createContext<
  BaseCalendarRootVisibleDateContext | undefined
>(undefined);

if (process.env.NODE_ENV !== 'production') {
  BaseCalendarRootVisibleDateContext.displayName = 'BaseCalendarRootVisibleDateContext';
}

export function useBaseCalendarRootVisibleDateContext() {
  const context = React.useContext(BaseCalendarRootVisibleDateContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI X: BaseCalendarRootVisibleDateContext is missing.',
        'Calendar parts must be placed within <Calendar.Root /> and Range Calendar parts must be placed within <RangeCalendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
