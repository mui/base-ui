import * as React from 'react';
import { DateSupportedShape } from '../../../../models';
import { ValidateDateProps } from '../../../../../validation';
import type { useBaseCalendarRoot } from './useSharedCalendarRoot';
import { BaseCalendarSection } from '../utils/types';
import { useBaseCalendarDayGridNavigation } from './useSharedCalendarDayGridsNavigation';

export interface BaseCalendarRootContext {
  /**
   * Whether the calendar is disabled.
   */
  disabled: boolean;
  /**
   * Whether the calendar is read-only.
   */
  readOnly: boolean;
  /**
   * The current date.
   * It is used to determine:
   * - if the rendered cells should be disabled or not
   * - which date to apply when clicking on a cell
   */
  currentDate: DateSupportedShape;
  /**
   * The list of currently selected dates.
   * When used inside the Calendar component, it contains the current value if not null.
   * When used inside the RangeCalendar component, it contains the selected start and/or end dates if not null.
   */
  selectedDates: DateSupportedShape[];
  /**
   * Select a date.
   * @param {DateSupportedShape} date The date to select.
   * @param {object} options The options to select the date.
   * @param {BaseCalendarSection} options.section The section handled by the UI that triggered the change.
   */
  selectDate: (date: DateSupportedShape, options: { section: BaseCalendarSection }) => void;
  /**
   * Determine if the given date is invalid.
   * @param {DateSupportedShape} date The date to check.
   * @returns {boolean} Whether the date is invalid.
   */
  isDateInvalid: (date: DateSupportedShape) => boolean;
  /**
   * The props to check if a date is valid or not.
   * Warning: Even when used inside the RangeCalendar component, this is still equal to the validation props for a single date.
   */
  dateValidationProps: Omit<ValidateDateProps, 'disableFuture' | 'disablePast'>;
  /**
   * Set the visible data.
   * @param {DateSupportedShape} visibleDate The new visible data.
   * @param {boolean} skipIfAlreadyVisible Whether to skip the update if the date is already inside one of the visible grids / lists.
   */
  setVisibleDate: (visibleDate: DateSupportedShape, skipIfAlreadyVisible: boolean) => void;
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
   * @param {React.KeyboardEvent} event The keyboard event.
   */
  applyDayGridKeyboardNavigation: (event: React.KeyboardEvent) => void;
  /**
   * Register a day cell ref to be able to apply keyboard navigation.
   * @param {useBaseCalendarDayGridNavigation.CellRefs} refs The grid, row and cell refs of the day cell.
   * @returns {() => void} A cleanup function to unregister the cell.
   */
  registerDayGridCell: (refs: useBaseCalendarDayGridNavigation.CellRefs) => () => void;
  /**
   * Register a section.
   * @param {useBaseCalendarRoot.RegisterSectionParameters} parameters The type and value of the section.
   * @returns {() => void} A cleanup function to unregister the section.
   */
  registerSection: (parameters: useBaseCalendarRoot.RegisterSectionParameters) => () => void;
}

export const BaseCalendarRootContext = React.createContext<BaseCalendarRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  BaseCalendarRootContext.displayName = 'BaseCalendarRootContext';
}

export function useBaseCalendarRootContext() {
  const context = React.useContext(BaseCalendarRootContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI X: BaseCalendarRootContext is missing.',
        'Calendar parts must be placed within <Calendar.Root /> and Range Calendar parts must be placed within <RangeCalendar.Root />.',
      ].join('\n'),
    );
  }
  return context;
}
