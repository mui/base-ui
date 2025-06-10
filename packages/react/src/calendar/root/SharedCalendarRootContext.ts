import * as React from 'react';
import { TemporalSupportedObject } from '../../models';
import { SharedCalendarStore } from '../store';

export interface SharedCalendarRootContext {
  /**
   * The store that holds the state of the calendar.
   */
  store: SharedCalendarStore;
  /**
   * Selects a date.
   */
  selectDate: (date: TemporalSupportedObject) => void;
  /**
   * Sets the visible data.
   */
  setVisibleDate: (visibleDate: TemporalSupportedObject, skipIfAlreadyVisible: boolean) => void;
  /**
   * Register a day grid.
   */
  registerDayGrid: (month: TemporalSupportedObject) => () => void;
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
