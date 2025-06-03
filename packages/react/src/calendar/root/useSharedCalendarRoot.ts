import * as React from 'react';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../models';
import { useDateManager, validateDate } from '../../utils/temporal/useDateManager';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useTemporalControlledValue } from '../../utils/temporal/useTemporalControlledValue';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { SharedCalendarRootVisibleDateContext } from './SharedCalendarRootVisibleDateContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { TemporalManager, TemporalTimezoneProps } from '../../utils/temporal/types';
import { useControlled } from '../../utils/useControlled';
import { mergeDateAndTime } from '../../utils/temporal/date-helpers';

export function useSharedCalendarRoot<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends Required<BaseDateValidationProps>,
>(
  parameters: useSharedCalendarRoot.Parameters<TValue, TError, TValidationProps>,
): useSharedCalendarRoot.ReturnValue {
  const adapter = useTemporalAdapter();

  const {
    // Form props
    readOnly = false,
    disabled = false,
    invalid,
    // Focus and navigation props
    monthPageSize = 1,
    yearPageSize = 1,
    // Value props
    defaultValue,
    onValueChange,
    value: valueProp,
    timezone: timezoneProp,
    referenceDate: referenceDateProp,
    // Visible date props
    onVisibleDateChange,
    visibleDate: visibleDateProp,
    defaultVisibleDate,
    // Validation props
    dateValidationProps,
    valueValidationProps,
    isDateUnavailable,
    // Manager props
    manager,
    calendarValueManager: {
      getDateToUseForReferenceDate,
      onSelectDate,
      getActiveDateFromValue,
      getSelectedDatesFromValue,
    },
  } = parameters;

  const handleValueChangeWithContext = useEventCallback((newValue: TValue) => {
    onValueChange?.(newValue, {
      validationError: manager.getValidationError(newValue, valueValidationProps),
    });
  });

  const { value, setValue, timezone } = useTemporalControlledValue({
    name: '(Range)CalendarRoot',
    timezone: timezoneProp,
    value: valueProp,
    defaultValue,
    referenceDate: referenceDateProp,
    onChange: handleValueChangeWithContext,
    manager,
  });

  const isInvalid = React.useMemo(() => {
    if (invalid != null) {
      return invalid;
    }

    const error = manager.getValidationError(value, valueValidationProps);
    return manager.isValidationErrorEmpty(error);
  }, [manager, value, invalid, valueValidationProps]);

  const referenceDate = React.useMemo(
    () => {
      return getInitialReferenceDate({
        adapter,
        timezone,
        externalDate: getDateToUseForReferenceDate(value),
        validationProps: dateValidationProps,
        referenceDate: referenceDateProp,
        precision: 'day',
      });
    },
    // We want the `referenceDate` to update on prop and `timezone` change (https://github.com/mui/mui-x/issues/10804)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [referenceDateProp, timezone],
  );
  const initialReferenceDate = React.useRef(referenceDate).current;

  const dayGridsRef = React.useRef<Record<number, TemporalSupportedObject>>({});

  const registerDayGrid = useEventCallback((month: TemporalSupportedObject) => {
    const id = Math.random();
    dayGridsRef.current![id] = month;

    return () => {
      delete dayGridsRef.current[id];
    };
  });

  const isDateCellVisible = (date: TemporalSupportedObject) => {
    if (Object.values(dayGridsRef.current).length > 0) {
      return Object.values(dayGridsRef.current).every((month) => !adapter.isSameMonth(date, month));
    }

    return true;
  };

  const [visibleDate, setVisibleDate] = useControlled({
    name: '(Range)CalendarRoot',
    state: 'visibleDate',
    controlled: visibleDateProp,
    default: defaultVisibleDate ?? initialReferenceDate,
  });

  const handleVisibleDateChange = useEventCallback(
    (newVisibleDate: TemporalSupportedObject, skipIfAlreadyVisible: boolean) => {
      if (skipIfAlreadyVisible && isDateCellVisible(newVisibleDate)) {
        return;
      }

      onVisibleDateChange?.(newVisibleDate);
      setVisibleDate(newVisibleDate);
    },
  );

  const [prevValue, setPrevValue] = React.useState<TValue>(value);
  if (value !== prevValue) {
    setPrevValue(value);
    const activeDate = getActiveDateFromValue(value);
    if (adapter.isValid(activeDate)) {
      handleVisibleDateChange(activeDate, true);
    }
  }

  const getDateValidationError = React.useCallback(
    (day: TemporalSupportedObject | null) =>
      validateDate({
        adapter,
        value: day,
        validationProps: dateValidationProps,
      }),
    [adapter, dateValidationProps],
  );

  const selectDate = useEventCallback<SharedCalendarRootContext['selectDate']>(
    (selectedDate: TemporalSupportedObject) => {
      if (readOnly) {
        return;
      }

      const activeDate = getActiveDateFromValue(value) ?? referenceDate;
      const cleanSelectedDate = mergeDateAndTime(adapter, selectedDate, activeDate);

      onSelectDate({
        setValue,
        prevValue: value,
        selectedDate: cleanSelectedDate,
        referenceDate,
      });
    },
  );

  const selectedDates = React.useMemo(
    () => getSelectedDatesFromValue(value),
    [getSelectedDatesFromValue, value],
  );

  const visibleDateContext: SharedCalendarRootVisibleDateContext = React.useMemo(
    () => ({ visibleDate }),
    [visibleDate],
  );

  const state: useSharedCalendarRoot.State = React.useMemo(
    () => ({
      empty: manager.areValuesEqual(value, manager.emptyValue),
      invalid: isInvalid,
      disabled,
      readOnly,
    }),
    [manager, value, isInvalid, disabled, readOnly],
  );

  const context: SharedCalendarRootContext = React.useMemo(
    () => ({
      timezone,
      disabled,
      getDateValidationError,
      referenceDate,
      selectedDates,
      setVisibleDate: handleVisibleDateChange,
      monthPageSize,
      yearPageSize,
      registerDayGrid,
      selectDate,
      dateValidationProps,
      isDateUnavailable,
    }),
    [
      timezone,
      disabled,
      getDateValidationError,
      referenceDate,
      selectedDates,
      handleVisibleDateChange,
      monthPageSize,
      yearPageSize,
      registerDayGrid,
      dateValidationProps,
      isDateUnavailable,
      selectDate,
    ],
  );

  return {
    state,
    context,
    visibleDateContext,
  };
}

export namespace useSharedCalendarRoot {
  export interface PublicParameters<TValue extends TemporalSupportedValue, TError>
    extends TemporalTimezoneProps {
    /**
     * The controlled value that should be selected.
     * To render an uncontrolled (Range)Calendar, use the `defaultValue` prop instead.
     */
    value?: TValue;
    /**
     * The uncontrolled value that should be initially selected.
     * To render a controlled (Range)Calendar, use the `value` prop instead.
     */
    defaultValue?: TValue;
    /**
     * Event handler called when the selected value changes.
     * Provides the new value as an argument.
     */
    onValueChange?: (value: TValue, context: ValueChangeHandlerContext<TError>) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the user should be unable to select a date in the calendar.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the calendar is forcefully marked as invalid.
     */
    invalid?: boolean;
    /**
     * Mark specific dates as unavailable.
     * Those dates will not be selectable but they will still be focusable with the keyboard.
     */
    isDateUnavailable?: (day: TemporalSupportedObject) => boolean;
    /**
     * The date used to decide which month should be displayed in the Days Grid and which year should be displayed in the Months List and Months Grid.
     * To render an uncontrolled Calendar, use the `defaultVisibleDate` prop instead.
     */
    visibleDate?: TemporalSupportedObject;
    /**
     * The date used to decide which month should be initially displayed in the Days Grid and which year should be initially displayed in the Months List and Months Grid.
     * To render a controlled Calendar, use the `visibleDate` prop instead.
     */
    defaultVisibleDate?: TemporalSupportedObject;
    /**
     * Event handler called when the visible date changes.
     * Provides the new visible date as an argument.
     * @param {TemporalSupportedObject} visibleDate The new visible date.
     */
    onVisibleDateChange?: (visibleDate: TemporalSupportedObject) => void;
    /**
     * The date used to generate the new value when both `value` and `defaultValue` are empty.
     * @default The closest valid date using the validation props.
     */
    referenceDate?: TemporalSupportedObject;
    /**
     * The amount of months to navigate by when pressing Calendar.SetVisibleMonth or when using keyboard navigation in the day grid.
     * This is mostly useful when displaying multiple day grids.
     * @default 1
     */
    monthPageSize?: number;
    /**
     * The amount of months to navigate by when pressing Calendar.SetVisibleYear or when using keyboard navigation in the month grid or the month list.
     * This is mostly useful when displaying multiple month grids or month lists.
     * @default 1
     */
    yearPageSize?: number;
  }

  export interface Parameters<
    TValue extends TemporalSupportedValue,
    TError,
    TValidationProps extends Required<BaseDateValidationProps>,
  > extends PublicParameters<TValue, TError> {
    /**
     * The manager of the calendar (uses `useDateManager` for Calendar and `useDateRangeManager` for RangeCalendar).
     */
    manager: TemporalManager<TValue, TError, any>;
    /**
     * The methods needed to manage the value of the calendar.
     * It helps sharing the code between the Calendar and the RangeCalendar.
     */
    calendarValueManager: ValueManager<TValue>;
    /**
     * The props used to validate a single date.
     */
    dateValidationProps: useDateManager.ValidationProps;
    /**
     * The props used to validate the value.
     */
    valueValidationProps: TValidationProps;
  }

  export interface ReturnValue {
    state: State;
    context: SharedCalendarRootContext;
    visibleDateContext: SharedCalendarRootVisibleDateContext;
  }

  export interface ValueChangeHandlerContext<TError> {
    /**
     * The validation error associated to the new value.
     */
    validationError: TError;
  }

  export interface RegisterDayGridParameters {
    value: TemporalSupportedObject;
  }

  export interface ValueManager<TValue extends TemporalSupportedValue> {
    /**
     * Returns the date to use for the reference date.
     */
    getDateToUseForReferenceDate: (value: TValue) => TemporalSupportedObject | null;
    /**
     * Runs logic when a date is selected.
     * This is used to correctly update the value on the Range Calendar.
     */
    onSelectDate: (parameters: OnSelectDateParameters<TValue>) => void;
    /**
     * Returns the active date from the value.
     * This is used to determine which date is being edited in the Range Calendar (start of end date).
     */
    getActiveDateFromValue: (value: TValue) => TemporalSupportedObject | null;
    /**
     * Returns list list of selected dates from the value.
     */
    getSelectedDatesFromValue: (value: TValue) => TemporalSupportedObject[];
  }

  export interface OnSelectDateParameters<TValue extends TemporalSupportedValue> {
    setValue: (value: TValue) => void;
    /**
     * The value before the change.
     */
    prevValue: TValue;
    /**
     * The date to select.
     */
    selectedDate: TemporalSupportedObject;
    /**
     * The reference date.
     */
    referenceDate: TemporalSupportedObject;
  }

  export interface State {
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
    readOnly?: boolean;
  }
}

interface BaseDateValidationProps {
  minDate?: TemporalSupportedObject;
  maxDate?: TemporalSupportedObject;
}
