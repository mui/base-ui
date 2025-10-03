import * as React from 'react';
import { TemporalSupportedObject } from '../../types/temporal';
import { SharedCalendarStore } from '../store';

export interface SharedCalendarRootContext {
  /**
   * The store that holds the state of the calendar.
   */
  store: SharedCalendarStore;
  /**
   * Selects a date.
   */
  selectDate: (date: TemporalSupportedObject, event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Sets the visible data.
   */
  setVisibleDate: (visibleDate: TemporalSupportedObject, skipIfAlreadyVisible: boolean) => void;
  /**
   * Register a day grid.
   */
  registerDayGrid: (month: TemporalSupportedObject) => () => void;
  /**
   * Register the current month's day grid row/week.
   */
  registerCurrentMonthDayGrid: (
    week: TemporalSupportedObject,
    days: TemporalSupportedObject[],
  ) => () => void;
  /**
   * The current month day grid days.
   * The keys are the week's first day UTC milliseconds and the values are the days of that week.
   */
  currentMonthDayGridRef: React.RefObject<Record<number, TemporalSupportedObject[]> | null>;
}

export const SharedCalendarRootContext = React.createContext<SharedCalendarRootContext | undefined>(
  undefined,
);

export function useSharedCalendarRootContext() {
  const context = React.useContext(SharedCalendarRootContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: SharedCalendarRootContext is missing.',
        'Calendar parts must be placed within <Calendar.Root /> and Range Calendar parts must be placed within <RangeCalendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
