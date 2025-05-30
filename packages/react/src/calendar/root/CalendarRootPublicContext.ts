import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface CalendarRootPublicContext {
  /**
   * The date currently visible.
   */
  visibleDate: TemporalSupportedObject;
}

export const CalendarRootPublicContext = React.createContext<CalendarRootPublicContext | undefined>(
  undefined,
);

export function useCalendarRootPublicContext() {
  const context = React.useContext(CalendarRootPublicContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: CalendarRootPublicContext is missing.',
        'Calendar parts must be placed within <Calendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
