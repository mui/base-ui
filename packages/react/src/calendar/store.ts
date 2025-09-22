import { Store, createSelector, createSelectorMemoized } from '@base-ui-components/utils/store';
import {
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../types/temporal';
import { TemporalAdapter } from '../types/temporal-adapter';
import { validateDate } from '../utils/temporal/validateDate';
import { getInitialReferenceDate } from '../utils/temporal/getInitialReferenceDate';
import { TemporalManager } from '../utils/temporal/types';

export interface CalendarState<TValue extends TemporalSupportedValue = any> {
  /**
   * The value of the calendar, as passed to `props.value` or `props.defaultValue`.
   */
  value: TValue;
  /**
   * The date that is currently visible in the calendar.
   */
  visibleDate: TemporalSupportedObject;
  /**
   * The initial date used to generate the reference date if any.
   */
  initialReferenceDateFromValue: TemporalSupportedObject | null;
  /**
   * The timezone as passed to `props.timezone`.
   */
  timezoneProp: TemporalTimezone | undefined;
  /**
   * The reference date as passed to `props.referenceDate`.
   */
  referenceDateProp: TemporalSupportedObject | null;
  /**
   * Whether the calendar is disabled.
   */
  disabled: boolean;
  /**
   * The props to check if a date is valid or not.
   */
  validationProps: validateDate.ValidationProps;
  /**
   * Mark specific dates as unavailable.
   * Those dates will not be selectable but they will still be focusable with the keyboard.
   */
  isDateUnavailable: ((day: TemporalSupportedObject) => boolean) | undefined;
  /**
   * The amount of months to navigate by when pressing Calendar.SetNextMonth, Calendar.SetPreviousMonth or when using keyboard navigation in the day grid.
   */
  monthPageSize: number;
  /**
   * The manager of the calendar (uses `useDateManager` for Calendar and `useDateRangeManager` for RangeCalendar).
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  manager: TemporalManager<TValue, any, any>;
  /**
   * The adapter of the date library.
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  adapter: TemporalAdapter;
}

export type SharedCalendarStore = Store<CalendarState>;

const timezoneToRenderSelector = createSelectorMemoized(
  (state: CalendarState) => state.adapter,
  (state: CalendarState) => state.manager,
  (state: CalendarState) => state.value,
  (state: CalendarState) => state.timezoneProp,
  (state: CalendarState) => state.referenceDateProp,
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

const referenceDateSelector = createSelectorMemoized(
  (state: CalendarState) => state.adapter,
  timezoneToRenderSelector,
  (state: CalendarState) => state.initialReferenceDateFromValue,
  (state: CalendarState) => state.validationProps,
  (state: CalendarState) => state.referenceDateProp,
  (adapter, timezone, initialReferenceDateFromValue, validationProps, referenceDateProp) =>
    getInitialReferenceDate({
      adapter,
      timezone,
      validationProps,
      precision: 'day',
      externalReferenceDate: referenceDateProp,
      externalDate: initialReferenceDateFromValue,
    }),
);

const valueWithTimezoneToRenderSelector = createSelector((state: CalendarState) => {
  const timezoneToRender = timezoneToRenderSelector(state);
  return state.manager.setTimezone(state.value, timezoneToRender);
}) as <TValue extends TemporalSupportedValue>(state: CalendarState<TValue>) => TValue;

const selectedDatesSelector = createSelectorMemoized(
  (state: CalendarState) => state.manager,
  (state: CalendarState) => state.value,
  (manager, value) => manager.getDatesFromValue(value),
);

const isDayCellDisabledSelector = createSelector(
  (state: CalendarState, value: TemporalSupportedObject) => {
    if (state.disabled) {
      return true;
    }

    const validationError = validateDate({
      adapter: state.adapter,
      value,
      validationProps: state.validationProps,
    });

    return validationError != null;
  },
);

const isDayCellUnavailableSelector = createSelector(
  (state: CalendarState, value) => state.isDateUnavailable?.(value) ?? false,
);

const isDayButtonSelectedSelector = createSelector(
  (state: CalendarState) => state.adapter,
  selectedDatesSelector,
  (state: CalendarState, value: TemporalSupportedObject) => value,
  (adapter, selectedDates, cellValue) => {
    return selectedDates.some((date) => adapter.isSameDay(date, cellValue));
  },
);

const isSetMonthButtonDisabledSelector = createSelector(
  (state: CalendarState) => state.adapter,
  (state: CalendarState, disabled: boolean | undefined, targetDate: TemporalSupportedObject) =>
    targetDate,
  (state: CalendarState) => state.validationProps,
  (state: CalendarState, disabled: boolean | undefined) => state.disabled || disabled,
  (
    adapter: TemporalAdapter,
    targetDate: TemporalSupportedObject,
    validationProps: validateDate.ValidationProps,
    isForcedDisabled: boolean | undefined,
  ) => {
    if (isForcedDisabled) {
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

export const selectors = {
  /**
   * Returns the props to check if a date is valid or not.
   */
  validationProps: createSelector((state: CalendarState) => state.validationProps),
  /**
   * Returns the amount of months to navigate by when pressing Calendar.SetNextMonth, Calendar.SetPreviousMonth or when using keyboard navigation in the day grid.
   */
  monthPageSize: createSelector((state: CalendarState) => state.monthPageSize),
  /**
   * Returns the date currently visible.
   */
  visibleDate: createSelector((state: CalendarState) => state.visibleDate),
  /**
   * Returns the current visible month.
   */
  visibleMonth: createSelector(
    (state: CalendarState) => state.adapter,
    (state: CalendarState) => state.visibleDate,
    (adapter, visibleDate) => adapter.startOfMonth(visibleDate),
  ),
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
};
