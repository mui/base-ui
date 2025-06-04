import * as React from 'react';
import { TemporalSupportedObject } from '../../models';

export interface SharedCalendarDayGridCellContext {
  /**
   * The value to select when this cell is clicked.
   */
  value: TemporalSupportedObject;
  /**
   * Whether the cell is disabled.
   */
  isDisabled: boolean;
  /**
   * Whether the cell is unavailable.
   */
  isUnavailable: boolean;
}

export const SharedCalendarDayGridCellContext = React.createContext<
  SharedCalendarDayGridCellContext | undefined
>(undefined);

export function useCalendarDayGridCellContext() {
  const context = React.useContext(SharedCalendarDayGridCellContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI X: SharedCalendarDayGridCellContext is missing.',
        '<Calendar.DayGridButton /> must be placed within <Calendar.DayGridCell /> and <RangeCalendar.DayGridButton /> must be placed within <RangeCalendar.DayGriCell />.',
      ].join('\n'),
    );
  }
  return context;
}
