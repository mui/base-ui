import * as React from 'react';
import { TemporalSupportedObject } from '../../models';
import { useSharedCalendarDayGridNavigation } from './useSharedCalendarDayGridsNavigation';
import { validateDate } from '../../utils/temporal/validateDate';

export interface SharedCalendarRootContext {
  /**
   * Whether the calendar is disabled.
   */
  disabled: boolean;
  /**
   * The reference date.
   */
  referenceDate: TemporalSupportedObject;
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
   * Returns the validation error of the given date.
   */
  getDateValidationError: (date: TemporalSupportedObject) => validateDate.Error;
  /**
   * The props to check if a date is valid or not.
   * Warning: Even when used inside the RangeCalendar component, this is still equal to the validation props for a single date.
   */
  dateValidationProps: validateDate.ValidationProps;
  /**
   * Mark specific dates as unavailable.
   * Those dates will not be selectable but they will still be focusable with the keyboard.
   */
  isDateUnavailable: ((day: TemporalSupportedObject) => boolean) | undefined;
  /**
   * Sets the visible data.
   */
  setVisibleDate: (visibleDate: TemporalSupportedObject, skipIfAlreadyVisible: boolean) => void;
  /**
   * The number of months to switch by when using clicking on SetVisibleMonth primitive with target="previous" or target="next".
   */
  monthPageSize: number;
  /**
   * The number of years to switch by when using clicking on SetVisibleYear primitive with target="previous" or target="next".
   */
  yearPageSize: number;
  /**
   * Callback forwarded to the `onKeyDown` prop of the day grid body.
   */
  applyDayGridKeyboardNavigation: (event: React.KeyboardEvent) => void;
  /**
   * Register a day cell ref to be able to apply keyboard navigation.
   */
  registerDayGridCell: (refs: useSharedCalendarDayGridNavigation.CellRefs) => () => void;
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
