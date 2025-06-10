import { TemporalSupportedObject } from '../models/temporal';
import { TemporalAdapter } from '../models/temporal-adapter';
import { Store, createSelector } from '../utils/store';
import { validateDate } from '../utils/temporal/date-helpers';

export type State = {
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
};

export type SharedCalendarStore = Store<State>;

export const selectors = {
  validationProps: createSelector((state: State) => state.validationProps),
  monthPageSize: createSelector((state: State) => state.monthPageSize),
  isDayCellDisabled: createSelector(
    (state: State, adapter: TemporalAdapter, value: TemporalSupportedObject) => {
      if (state.disabled) {
        return true;
      }

      const validationError = validateDate({
        adapter,
        value,
        validationProps: state.validationProps,
      });

      return validationError != null;
    },
  ),
  isDayCellUnavailable: createSelector((state: State, value: TemporalSupportedObject) => {
    return state.isDateUnavailable?.(value) ?? false;
  }),
  isSetMonthButtonDisabled: createSelector(
    (
      state: State,
      adapter: TemporalAdapter,
      disabled: boolean | undefined,
      targetDate: TemporalSupportedObject,
    ) => {
      if (disabled || state.disabled) {
        return true;
      }

      // The month targeted and all the months before are fully disabled, we disable the button.
      if (
        state.validationProps.minDate != null &&
        adapter.isBefore(adapter.endOfMonth(targetDate), state.validationProps.minDate)
      ) {
        return true;
      }

      // The month targeted and all the months after are fully disabled, we disable the button.
      return (
        state.validationProps.maxDate != null &&
        adapter.isAfter(adapter.startOfMonth(targetDate), state.validationProps.maxDate)
      );
    },
  ),
};
