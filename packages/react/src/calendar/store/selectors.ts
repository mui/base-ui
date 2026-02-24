import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../types/temporal';
import { validateDate } from '../../utils/temporal/validateDate';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { CalendarNavigationDirection, SharedCalendarState as State } from './SharedCalendarState';
import { TemporalAdapter } from '../../types';

const timezoneToRenderSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  (state: State) => state.manager,
  (state: State) => state.value,
  (state: State) => state.timezoneProp,
  (state: State) => state.referenceDateProp,
  (adapter, manager, value, timezoneProp, referenceDateProp) => {
    if (timezoneProp != null) {
      return timezoneProp;
    }

    const valueTimezone = manager.getTimezone(value);
    if (valueTimezone) {
      return valueTimezone;
    }

    if (referenceDateProp) {
      return adapter.getTimezone(referenceDateProp);
    }
    return 'default';
  },
);

const validationPropsSelector = createSelectorMemoized(
  (state: State) => state.minDate,
  (state: State) => state.maxDate,
  (minDate, maxDate) => ({ minDate, maxDate }),
);

const referenceDateSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  timezoneToRenderSelector,
  (state: State) => state.initialReferenceDateFromValue,
  validationPropsSelector,
  (state: State) => state.referenceDateProp,
  (adapter, timezone, initialReferenceDateFromValue, validationProps, referenceDateProp) =>
    getInitialReferenceDate({
      adapter,
      timezone,
      granularity: 'day',
      validationProps,
      externalReferenceDate: referenceDateProp,
      externalDate: initialReferenceDateFromValue,
    }),
);

const valueWithTimezoneToRenderSelector = createSelectorMemoized(
  timezoneToRenderSelector,
  (state: State) => state.manager,
  (state: State) => state.value,
  (timezone, manager, value) => manager.setTimezone(value, timezone),
) as <TValue extends TemporalSupportedValue>(state: State<TValue>) => TValue;

const selectedDatesSelector = createSelectorMemoized(
  (state: State) => state.manager,
  (state: State) => state.value,
  timezoneToRenderSelector,
  (manager, value, timezone) =>
    manager.getDatesFromValue(value).map((date) => {
      if (manager.getTimezone(date) === timezone) {
        return date;
      }
      return manager.setTimezone(date, timezone);
    }),
);

const isDayCellDisabledSelector = createSelector((state: State, value: TemporalSupportedObject) => {
  if (state.disabled) {
    return true;
  }

  const validationError = validateDate({
    adapter: state.adapter,
    value,
    validationProps: validationPropsSelector(state),
  });

  return validationError != null;
});

const isDayCellUnavailableSelector = createSelector(
  (state: State, value: TemporalSupportedObject) => state.isDateUnavailable?.(value) ?? false,
);

const isDayButtonSelectedSelector = createSelector(
  (state: State) => state.adapter,
  selectedDatesSelector,
  (adapter, selectedDates, cellValue: TemporalSupportedObject) => {
    return selectedDates.some((date) => adapter.isSameDay(cellValue, date));
  },
);

const isSetMonthButtonDisabledSelector = createSelector(
  (state: State) => state.adapter,
  validationPropsSelector,
  (state: State) => state.disabled,
  (
    adapter,
    validationProps,
    isCalendarDisabled,
    disabled: boolean | undefined,
    targetDate: TemporalSupportedObject,
  ) => {
    if (isCalendarDisabled || disabled) {
      return true;
    }

    // The month targeted and all the months before are fully disabled, we disable the button.
    if (
      validationProps.minDate != null &&
      adapter.isBefore(adapter.endOfMonth(targetDate), validationProps.minDate)
    ) {
      return true;
    }

    // The month targeted and all the months after are fully disabled, we disable the button.
    return (
      validationProps.maxDate != null &&
      adapter.isAfter(adapter.startOfMonth(targetDate), validationProps.maxDate)
    );
  },
);

const visibleDateSelector = createSelector((state: State) => state.visibleDate);

const visibleMonthSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  visibleDateSelector,
  (adapter, date: TemporalSupportedObject) => adapter.startOfMonth(date),
);

const isValueInvalidSelector = createSelectorMemoized(
  (state: State) => state.manager,
  (state: State) => state.invalidProp,
  valueWithTimezoneToRenderSelector,
  validationPropsSelector,
  (manager, invalidProp, value, validationProps) => {
    if (invalidProp != null) {
      return invalidProp;
    }

    const error = manager.getValidationError(value, validationProps);
    return !manager.isValidationErrorEmpty(error);
  },
);

const rootElementStateSelector = createSelectorMemoized(
  (state: State) => state.manager,
  (state: State) => state.readOnly,
  (state: State) => state.disabled,
  (state: State) => state.navigationDirection,
  isValueInvalidSelector,
  valueWithTimezoneToRenderSelector,
  (manager, readOnly, disabled, navigationDirection, invalid, value) => ({
    empty: manager.areValuesEqual(value, manager.emptyValue),
    invalid,
    disabled,
    readOnly,
    navigationDirection,
  }),
);

const publicContextSelector = createSelectorMemoized(visibleDateSelector, (visibleDate) => ({
  visibleDate,
}));

const getMonthKey = (adapter: TemporalAdapter, date: TemporalSupportedObject) =>
  adapter.formatByString(date, `${adapter.formats.monthPadded}-${adapter.formats.yearPadded}`);

const getDateKey = (adapter: TemporalAdapter, date: TemporalSupportedObject) =>
  adapter.format(date, 'localizedNumericDate');

const tabbableCellsPerMonthSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  selectedDatesSelector,
  referenceDateSelector,
  (adapter, selectedDates, referenceDate) => {
    const months = new Map<string, Set<string>>();

    // Each month that contains selected dates has these selected dates as tabbable cells.
    for (const date of selectedDates) {
      const monthKey = getMonthKey(adapter, date);
      if (!months.has(monthKey)) {
        months.set(monthKey, new Set());
      }
      months.get(monthKey)!.add(getDateKey(adapter, date));
    }

    // If the month containing the reference dates has no selected dates, then the reference date will be tabbable in this month.
    const referenceDateMonthKey = getMonthKey(adapter, referenceDate);
    if (!months.has(referenceDateMonthKey)) {
      months.set(referenceDateMonthKey, new Set([getDateKey(adapter, referenceDate)]));
    }

    return months;
  },
);

const isDayButtonTabbableSelector = createSelector(
  tabbableCellsPerMonthSelector,
  (state: State) => state.adapter,
  (
    tabbableCellsPerMonth,
    adapter,
    date: TemporalSupportedObject,
    month: TemporalSupportedObject,
  ) => {
    // If the date is not in the current month, it cannot be tabbable.
    if (!adapter.isSameMonth(date, month)) {
      return false;
    }

    const monthKey = getMonthKey(adapter, date);

    // If the month has registed tabbable cells, we check if the date is one of them.
    if (tabbableCellsPerMonth.has(monthKey)) {
      const dateKey = getDateKey(adapter, date);
      return tabbableCellsPerMonth.get(monthKey)!.has(dateKey);
    }

    // Otherwise, only the first day of the month is tabbable.
    const firstDayOfMonth = adapter.startOfMonth(date);
    return adapter.isSameDay(date, firstDayOfMonth);
  },
);

export const selectors = {
  /**
   * Returns the state of the root element.
   */
  rootElementState: rootElementStateSelector,
  /**
   * Returns the context to publicly expose in render functions and hooks.
   */
  publicContext: publicContextSelector,
  /**
   * Returns the props to check if a date is valid or not.
   */
  validationProps: validationPropsSelector,
  /**
   * Returns the amount of months to navigate by when pressing `<Calendar.IncrementMonth>` or `<Calendar.DecrementMonth>`.
   */
  monthPageSize: createSelector((state: State) => state.monthPageSize),
  /**
   * Returns the date currently visible.
   */
  visibleDate: visibleDateSelector,
  /**
   * Returns the current visible month.
   */
  visibleMonth: visibleMonthSelector,
  /**
   * Returns the navigation direction.
   */
  navigationDirection: createSelector((state: State) => state.navigationDirection),
  /**
   * Returns the current value with the timezone to render applied.
   */
  valueWithTimezoneToRender: valueWithTimezoneToRenderSelector,
  /**
   * Returns the reference date.
   */
  referenceDate: referenceDateSelector,
  /**
   * Returns the list of currently selected dates.
   * When used inside the Calendar component, it contains the current value if not null.
   * When used inside the RangeCalendar component, it contains the selected start and/or end dates if not null.
   */
  selectedDates: selectedDatesSelector,
  /**
   * Checks if a day cell should be disabled.
   */
  isDayCellDisabled: isDayCellDisabledSelector,
  /**
   * Checks if a day cell should be selected.
   */
  isDayButtonSelected: isDayButtonSelectedSelector,
  /**
   * Checks if a specific dates is unavailable.
   * If so, this date should not be selectable but should still be focusable with the keyboard.
   */
  isDayCellUnavailable: isDayCellUnavailableSelector,
  /**
   * Checks if a month navigation button should be disabled.
   */
  isSetMonthButtonDisabled: isSetMonthButtonDisabledSelector,
  /**
   * Checks if a day should be reachable using tab navigation.
   */
  isDayButtonTabbable: isDayButtonTabbableSelector,
};

export interface CalendarRootElementState {
  /**
   * Whether the current value is empty.
   */
  empty: boolean;
  /**
   * Whether the current value is invalid.
   */
  invalid: boolean;
  /**
   * Whether the calendar is disabled.
   */
  disabled: boolean;
  /**
   * Whether the calendar is readonly.
   */
  readOnly?: boolean | undefined;
  /**
   * The direction of the navigation (based on the month navigating to).
   */
  navigationDirection: CalendarNavigationDirection;
}
