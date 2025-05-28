import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface SharedCalendarRootVisibleDateContext {
  /**
   * The date currently visible.
   * It is used to determine:
   * - which month to render in Calendar.DayGrid and RangeCalendar.DayGrid
   * - which year to render in Calendar.YearGrid, Calendar.YearList, RangeCalendar.YearGrid, and RangeCalendar.YearList
   */
  visibleDate: TemporalSupportedObject;
}

export const SharedCalendarRootVisibleDateContext = React.createContext<
  SharedCalendarRootVisibleDateContext | undefined
>(undefined);

export function useSharedCalendarRootVisibleDateContext() {
  const context = React.useContext(SharedCalendarRootVisibleDateContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: SharedCalendarRootVisibleDateContext is missing.',
        'Calendar parts must be placed within <Calendar.Root /> and Range Calendar parts must be placed within <RangeCalendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
