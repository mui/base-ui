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

export type State<TValue extends TemporalSupportedValue> = {
  /**
   * The value of the calendar, as passed to `props.value` or `props.defaultValue`.
   */
  value: TValue;
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
};

export type SharedCalendarStore = Store<State<any>>;

const timezoneToRenderSelector = createSelector((state: State<any>) => {
  if (state.timezoneProp) {
    return state.timezoneProp;
  }

  const valueTimezone = state.manager.getTimezone(state.value);
  if (valueTimezone) {
    return valueTimezone;
  }

  if (state.referenceDateProp) {
    return state.adapter.getTimezone(state.referenceDateProp);
  }
  return 'default';
}) as <TValue extends TemporalSupportedValue>(state: State<TValue>) => TemporalTimezone;

export const selectors = {
  validationProps: createSelector((state: State<any>) => state.validationProps),
  monthPageSize: createSelector((state: State<any>) => state.monthPageSize),
  timezoneToRender: timezoneToRenderSelector,
  valueWithTimezoneToRender: createSelector((state: State<any>) => {
    const timezoneToRender = selectors.timezoneToRender(state);
    return state.manager.setTimezone(state.value, timezoneToRender);
  }) as <TValue extends TemporalSupportedValue>(state: State<TValue>) => TValue,
  referenceDate: createSelectorMemoized(
    (state: State<any>) => state.adapter,
    timezoneToRenderSelector,
    (state: State<any>) => state.initialReferenceDateFromValue,
    (state: State<any>) => state.validationProps,
    (state: State<any>) => state.referenceDateProp,
    (adapter, timezoneProp, initialReferenceDateFromValue, validationProps, referenceDateProp) =>
      getInitialReferenceDate({
        adapter,
        timezone: timezoneProp,
        externalDate: initialReferenceDateFromValue,
        validationProps,
        referenceDate: referenceDateProp,
        precision: 'day',
      }),
  ),
  isDayCellDisabled: createSelector((state: State<any>, value: TemporalSupportedObject) => {
    if (state.disabled) {
      return true;
    }

    const validationError = validateDate({
      adapter: state.adapter,
      value,
      validationProps: state.validationProps,
    });

    return validationError != null;
  }),
  isDayCellUnavailable: createSelector((state: State<any>, value: TemporalSupportedObject) => {
    return state.isDateUnavailable?.(value) ?? false;
  }),
  isSetMonthButtonDisabled: createSelector(
    (state: State<any>, disabled: boolean | undefined, targetDate: TemporalSupportedObject) => {
      if (disabled || state.disabled) {
        return true;
      }

      // The month targeted and all the months before are fully disabled, we disable the button.
      if (
        state.validationProps.minDate != null &&
        state.adapter.isBefore(state.adapter.endOfMonth(targetDate), state.validationProps.minDate)
      ) {
        return true;
      }

      // The month targeted and all the months after are fully disabled, we disable the button.
      return (
        state.validationProps.maxDate != null &&
        state.adapter.isAfter(state.adapter.startOfMonth(targetDate), state.validationProps.maxDate)
      );
    },
  ),
};
