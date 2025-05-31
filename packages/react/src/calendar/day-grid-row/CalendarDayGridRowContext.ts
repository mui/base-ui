import * as React from 'react';

export interface CalendarDayGridRowContext {
  /**
   * The DOM ref of the DayGridRow primitive.
   */
  ref: React.RefObject<HTMLDivElement | null>;
}

export const CalendarDayGridRowContext = React.createContext<CalendarDayGridRowContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  CalendarDayGridRowContext.displayName = 'CalendarDayGridRowContext';
}

export function useCalendarDayGridRowContext() {
  const context = React.useContext(CalendarDayGridRowContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI X: CalendarDayGridRowContext is missing.',
        '<Calendar.DayGridCell /> must be placed within <Calendar.DayGridRow /> and <RangeCalendar.DayGridCell /> must be placed within <RangeCalendar.DayGridRow />.',
      ].join('\n'),
    );
  }
  return context;
}
