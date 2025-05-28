import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface SharedCalendarDayGridBodyContext {
  /**
   * The month of this component.
   */
  month: TemporalSupportedObject;
  /**
   * Return true if the day should be reachable using tab navigation.
   * @param {TemporalSupportedObject} day The day to check.
   * @returns {boolean} Whether the day should be reachable using tab navigation.
   */
  canCellBeTabbed: (day: TemporalSupportedObject) => boolean;
  /**
   * The days grid to render inside this component.
   */
  daysGrid: TemporalSupportedObject[][];
  /**
   * The DOM ref of the DayGridBody primitive.
   */
  ref: React.RefObject<HTMLElement | null>;
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
