import * as React from 'react';
import { TemporalSupportedObject } from '../../types/temporal';

export interface SharedCalendarDayGridBodyContext {
  /**
   * The month of this component.
   */
  month: TemporalSupportedObject;
}

export const SharedCalendarDayGridBodyContext = React.createContext<
  SharedCalendarDayGridBodyContext | undefined
>(undefined);

export function useSharedCalendarDayGridBodyContext() {
  const context = React.useContext(SharedCalendarDayGridBodyContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: SharedCalendarDayGridBodyContext is missing.',
        '<Calendar.DayGridRow /> must be placed within <Calendar.DayGridBody /> and <RangeCalendar.DayGridRow /> must be placed within <RangeCalendar.DayGridBody />.',
      ].join('\n'),
    );
  }
  return context;
}
