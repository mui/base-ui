import {
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../models/temporal';
import { TemporalAdapter } from '../models/temporal-adapter';
import { Store, createSelector, createSelectorMemoized } from '../utils/store';
import { validateDate } from '../utils/temporal/date-helpers';
import { getInitialReferenceDate } from '../utils/temporal/getInitialReferenceDate';
import { TemporalManager } from '../utils/temporal/types';

export interface State<TValue extends TemporalSupportedValue = any> {
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
  referenceDateProp: TemporalSupportedObject | undefined;
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

export type SharedCalendarStore = Store<State>;

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

const referenceDateSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  timezoneToRenderSelector,
  (state: State) => state.initialReferenceDateFromValue,
  (state: State) => state.validationProps,
  (state: State) => state.referenceDateProp,
  (adapter, timezone, initialReferenceDateFromValue, validationProps, referenceDateProp) =>
    getInitialReferenceDate({
      adapter,
      timezone,
      externalDate: initialReferenceDateFromValue,
      validationProps,
      referenceDate: referenceDateProp,
      precision: 'day',
    }),
);

const valueWithTimezoneToRenderSelector = createSelector((state: State) => {
  const timezoneToRender = timezoneToRenderSelector(state);
  return state.manager.setTimezone(state.value, timezoneToRender);
}) as <TValue extends TemporalSupportedValue>(state: State<TValue>) => TValue;

const selectedDatesSelector = createSelectorMemoized(
  (state: State) => state.manager,
  (state: State) => state.value,
  (manager, value) => manager.getDatesFromValue(value),
);

const isDayCellDisabledSelector = createSelector((state: State, value: TemporalSupportedObject) => {
  if (state.disabled) {
    return true;
  }

  const validationError = validateDate({
    adapter: state.adapter,
    value,
    validationProps: state.validationProps,
  });

  return validationError != null;
});

const isDayCellUnavailableSelector = createSelector(
  (state: State, value) => state.isDateUnavailable?.(value) ?? false,
);

const isDayButtonSelectedSelector = createSelector(
  (state: State) => state.adapter,
  selectedDatesSelector,
  (state: State, value: TemporalSupportedObject) => value,
  (adapter, selectedDates, cellValue) => {
    return selectedDates.some((date) => adapter.isSameDay(date, cellValue));
  },
);

const isSetMonthButtonDisabledSelector = createSelector(
  (state: State, disabled: boolean | undefined) => state.disabled || disabled,
  (state: State, disabled: boolean | undefined, targetDate: TemporalSupportedObject) => targetDate,
  (state: State) => state.validationProps,
  (state: State) => state.adapter,
  (
    isForcedDisabled: boolean | undefined,
    targetDate: TemporalSupportedObject,
    validationProps: validateDate.ValidationProps,
    adapter: TemporalAdapter,
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
  validationProps: createSelector((state: State) => state.validationProps),
  /**
   * Returns the amount of months to navigate by when pressing Calendar.SetNextMonth, Calendar.SetPreviousMonth or when using keyboard navigation in the day grid.
   */
  monthPageSize: createSelector((state: State) => state.monthPageSize),
  /**
   * Returns the date currently visible.
   */
  visibleDate: createSelector((state: State) => state.visibleDate),
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
