import * as React from 'react';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../models';
import { validateDate } from '../../utils/temporal/validateDate';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useTemporalControlledValue } from '../../utils/temporal/useTemporalControlledValue';
import { useSharedCalendarDayGridNavigation } from './useSharedCalendarDayGridsNavigation';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { SharedCalendarRootVisibleDateContext } from './SharedCalendarRootVisibleDateContext';
import { useTemporalValidation } from '../../utils/temporal/useTemporalValidation';
import { useEventCallback } from '../../utils/useEventCallback';
import {
  TemporalManager,
  TemporalOnErrorProps,
  TemporalTimezoneProps,
} from '../../utils/temporal/types';
import { useControlled } from '../../utils/useControlled';
import { mergeDateAndTime } from '../../utils/temporal/date-helpers';

export function useSharedCalendarRoot<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends Required<BaseDateValidationProps>,
>(
  parameters: useSharedCalendarRoot.Parameters<TValue, TError, TValidationProps>,
): useSharedCalendarRoot.ReturnValue<TValue> {
  const adapter = useTemporalAdapter();

  const {
    // Form props
    readOnly = false,
    disabled = false,
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
    onError,
    dateValidationProps,
    valueValidationProps,
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
      validationError: manager.getError(newValue, valueValidationProps),
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

  const { isInvalid } = useTemporalValidation({
    manager,
    value,
    onError,
    validationProps: valueValidationProps,
  });

  const referenceDate = React.useMemo(
    () => {
      return getInitialReferenceDate({
        adapter,
        timezone,
        controlledDate: getDateToUseForReferenceDate(value),
        props: dateValidationProps,
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

  const { applyDayGridKeyboardNavigation, registerDayGridCell } =
    useSharedCalendarDayGridNavigation({
      visibleDate,
      setVisibleDate,
      monthPageSize,
      dateValidationProps,
    });

  const isDateInvalid = React.useCallback(
    (day: TemporalSupportedObject | null) =>
      validateDate({
        adapter,
        value: day,
        validationProps: dateValidationProps,
      }) !== null,
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

  const context: SharedCalendarRootContext = React.useMemo(
    () => ({
      timezone,
      disabled,
      isDateInvalid,
      referenceDate,
      selectedDates,
      setVisibleDate: handleVisibleDateChange,
      monthPageSize,
      yearPageSize,
      applyDayGridKeyboardNavigation,
      registerDayGridCell,
      registerDayGrid,
      selectDate,
      dateValidationProps,
    }),
    [
      timezone,
      disabled,
      isDateInvalid,
      referenceDate,
      selectedDates,
      handleVisibleDateChange,
      monthPageSize,
      yearPageSize,
      applyDayGridKeyboardNavigation,
      registerDayGridCell,
      registerDayGrid,
      dateValidationProps,
      selectDate,
    ],
  );

  return {
    value,
    referenceDate,
    setValue,
    setVisibleDate,
    isDateCellVisible,
    context,
    visibleDateContext,
    isInvalid,
  };
}

export namespace useSharedCalendarRoot {
  export interface PublicParameters<TValue extends TemporalSupportedValue, TError>
    extends TemporalTimezoneProps,
      TemporalOnErrorProps<TValue, TError> {
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
     * @param {TValue} value The new selected value.
     * @param {ValueChangeHandlerContext<TError>} context Additional context information.
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
     * The date used to decide which month should be displayed in the Days Grid and which year should be displayed in the Months List and Months Grid.
     * To render an uncontrolled (Range)Calendar, use the `defaultVisibleDate` prop instead.
     */
    visibleDate?: TemporalSupportedObject;
    /**
     * The date used to decide which month should be initially displayed in the Days Grid and which year should be initially displayed in the Months List and Months Grid.
     * To render a controlled (Range)Calendar, use the `visibleDate` prop instead.
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
     * @default The closest valid date using the validation props, except callbacks such as `shouldDisableDate`.
     */
    referenceDate?: TemporalSupportedObject;
    /**
     * The amount of months to navigate by when pressing <(Range)Calendar.SetVisibleMonth /> or when using keyboard navigation in the day grid.
     * This is mostly useful when displaying multiple day grids.
     * @default 1
     */
    monthPageSize?: number;
    /**
     * The amount of months to navigate by when pressing <(Range)Calendar.SetVisibleYear /> or when using keyboard navigation in the month grid or the month list.
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
    dateValidationProps: validateDate.ValidationProps;
    /**
     * The props used to validate the value.
     */
    valueValidationProps: TValidationProps;
  }

  export interface ReturnValue<TValue extends TemporalSupportedValue> {
    value: TValue;
    referenceDate: TemporalSupportedObject;
    setValue: (newValue: TValue) => void;
    setVisibleDate: (
      newVisibleDate: TemporalSupportedObject,
      skipIfAlreadyVisible: boolean,
    ) => void;
    isDateCellVisible: (date: TemporalSupportedObject) => boolean;
    context: SharedCalendarRootContext;
    visibleDateContext: SharedCalendarRootVisibleDateContext;
    /**
     * Whether the current value is invalid.
     */
    isInvalid: boolean;
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
}

interface BaseDateValidationProps {
  minDate?: TemporalSupportedObject;
  maxDate?: TemporalSupportedObject;
}
