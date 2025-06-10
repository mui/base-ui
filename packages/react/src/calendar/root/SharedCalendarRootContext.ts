import * as React from 'react';
import { TemporalSupportedObject } from '../../models';
import { SharedCalendarStore } from '../store';

export interface SharedCalendarRootContext {
  /**
   * The reference date.
   */
  referenceDate: TemporalSupportedObject;
  /**
   * The store that holds the state of the calendar.
   */
  store: SharedCalendarStore;
  /**
   * The list of currently selected dates.
   * When used inside the Calendar component, it contains the current value if not null.
   * When used inside the RangeCalendar component, it contains the selected start and/or end dates if not null.
   */
  selectedDates: TemporalSupportedObject[];
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
