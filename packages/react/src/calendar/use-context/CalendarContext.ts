import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface CalendarContext {
  /**
   * The date currently visible.
   */
  visibleDate: TemporalSupportedObject;
}

export const CalendarContext = React.createContext<CalendarContext | undefined>(undefined);

export function useCalendarContext() {
  const context = React.useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: CalendarContext is missing.',
        'Calendar parts must be placed within <Calendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
