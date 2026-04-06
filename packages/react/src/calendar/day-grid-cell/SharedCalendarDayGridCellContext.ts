'use client';
import * as React from 'react';
import { TemporalSupportedObject } from '../../types/temporal';

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
  /**
   * Whether the cell is outside the current month.
   */
  isOutsideCurrentMonth: boolean;
}

export const SharedCalendarDayGridCellContext = React.createContext<
  SharedCalendarDayGridCellContext | undefined
>(undefined);

export function useCalendarDayGridCellContext() {
  const context = React.useContext(SharedCalendarDayGridCellContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SharedCalendarDayGridCellContext is missing. <Calendar.DayButton /> must be placed within <Calendar.DayGridCell /> and <RangeCalendar.DayButton /> must be placed within <RangeCalendar.DayGridCell />.',
    );
  }
  return context;
}
