import * as React from 'react';
import {
  PickerChangeImportance,
  PickerManager,
  DateSupportedShape,
  DateSupportedValue,
} from '../../../../models';
import { ValidateDateProps, validateDate } from '../../../../../validation/validateDate';
import { SECTION_TYPE_GRANULARITY } from '../../../../utils/getDefaultReferenceDate';
import { singleItemValueManager } from '../../../../utils/valueManagers';
import { useDefaultDates, useLocalizationContext, useUtils } from '../../../../hooks/useUtils';
import { useDateAdapter } from '../../../../date-adapter-provider/DateAdapterContext';
import { useControlledValue } from '../../../../hooks/useControlledValue';
import { BaseDateValidationProps } from '../../../../models/validation';
import { useBaseCalendarDayGridNavigation } from './useSharedCalendarDayGridsNavigation';
import { BaseCalendarRootContext } from './SharedCalendarRootContext';
import { BaseCalendarSection } from '../utils/types';
import { BaseCalendarRootVisibleDateContext } from './SharedCalendarRootVisibleDateContext';
import { useValidation } from '../../../../../validation';
import { useEventCallback } from '../../../useEventCallback';
import { DateOnErrorProps, DateTimezoneProps } from '../../types';

export function useSharedCalendarRoot<
  TValue extends DateSupportedValue,
  TError,
  TValidationProps extends Required<BaseDateValidationProps>,
>(
  parameters: useSharedCalendarRoot.Parameters<TValue, TError, TValidationProps>,
): useSharedCalendarRoot.ReturnValue<TValue> {
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
      getCurrentDateFromValue,
      getSelectedDatesFromValue,
    },
  } = parameters;

  const adapter = useDateAdapter();
  const adapterContext = useLocalizationContext();

  const { value, handleValueChange, timezone } = useControlledValue({
    name: '(Range)CalendarRoot',
    timezone: timezoneProp,
    value: valueProp,
    defaultValue,
    referenceDate: referenceDateProp,
    onChange: onValueChange,
    valueManager: manager.internal_valueManager,
  });

  const referenceDate = React.useMemo(
    () => {
      return singleItemValueManager.getInitialReferenceValue({
        value: getDateToUseForReferenceDate(value),
        utils: adapter,
        timezone,
        props: dateValidationProps,
        referenceDate: referenceDateProp,
        granularity: SECTION_TYPE_GRANULARITY.day,
      });
    },
    // We want the `referenceDate` to update on prop and `timezone` change (https://github.com/mui/mui-x/issues/10804)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [referenceDateProp, timezone],
  );
  const initialReferenceDate = React.useRef(referenceDate).current;

  const sectionsRef = React.useRef<Record<BaseCalendarSection, Record<number, DateSupportedShape>>>(
    {
      day: [],
      month: [],
      year: [],
    },
  );

  const registerSection = useEventCallback(
    (section: useBaseCalendarRoot.RegisterSectionParameters) => {
      const id = Math.random();

      sectionsRef.current[section.type]![id] = section.value;
      return () => {
        delete sectionsRef.current[section.type][id];
      };
    },
  );

  const isDateCellVisible = (date: DateSupportedShape) => {
    const daySections = sectionsRef.current.day ?? [];
    const monthSections = sectionsRef.current.month ?? [];

    if (Object.values(daySections).length > 0) {
      return Object.values(daySections).every((month) => !adapter.isSameMonth(date, month));
    }
    if (Object.values(monthSections).length > 0) {
      return Object.values(monthSections).every((year) => !adapter.isSameYear(date, year));
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
    (newVisibleDate: DateSupportedShape, skipIfAlreadyVisible: boolean) => {
      if (skipIfAlreadyVisible && isDateCellVisible(newVisibleDate)) {
        return;
      }

      onVisibleDateChange?.(newVisibleDate);
      setVisibleDate(newVisibleDate);
    },
  );

  const { applyDayGridKeyboardNavigation, registerDayGridCell } = useBaseCalendarDayGridNavigation({
    visibleDate,
    setVisibleDate,
    monthPageSize,
    dateValidationProps,
  });

  const isDateInvalid = React.useCallback(
    (day: DateSupportedShape | null) =>
      validateDate({
        adapter: adapterContext,
        value: day,
        timezone,
        props: dateValidationProps,
      }) !== null,
    [adapterContext, dateValidationProps, timezone],
  );

  const { getValidationErrorForNewValue } = useValidation({
    props: { ...valueValidationProps, onError },
    validator: manager.validator,
    timezone,
    value,
    onError,
  });

  const setValue = useEventCallback(
    (
      newValue: TValue,
      options: { section: BaseCalendarSection; changeImportance: 'set' | 'accept' },
    ) => {
      handleValueChange(newValue, {
        section: options.section,
        changeImportance: options.changeImportance,
        validationError: getValidationErrorForNewValue(newValue),
      });
    },
  );

  const selectDate = useEventCallback<BaseCalendarRootContext['selectDate']>(
    (selectedDate: DateSupportedShape, options) => {
      onSelectDate({
        setValue,
        prevValue: value,
        selectedDate,
        referenceDate,
        section: options.section,
      });
    },
  );

  const currentDate = getCurrentDateFromValue(value) ?? referenceDate;

  const selectedDates = React.useMemo(
    () => getSelectedDatesFromValue(value),
    [getSelectedDatesFromValue, value],
  );

  const visibleDateContext: BaseCalendarRootVisibleDateContext = React.useMemo(
    () => ({ visibleDate }),
    [visibleDate],
  );

  const context: BaseCalendarRootContext = React.useMemo(
    () => ({
      timezone,
      disabled,
      readOnly,
      isDateInvalid,
      currentDate,
      selectedDates,
      setVisibleDate: handleVisibleDateChange,
      monthPageSize,
      yearPageSize,
      applyDayGridKeyboardNavigation,
      registerDayGridCell,
      registerSection,
      selectDate,
      dateValidationProps,
    }),
    [
      timezone,
      disabled,
      readOnly,
      isDateInvalid,
      currentDate,
      selectedDates,
      handleVisibleDateChange,
      monthPageSize,
      yearPageSize,
      applyDayGridKeyboardNavigation,
      registerDayGridCell,
      registerSection,
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
  };
}

export namespace useSharedCalendarRoot {
  export interface PublicParameters<TValue extends DateSupportedValue, TError>
    extends DateTimezoneProps,
      DateOnErrorProps<TValue, TError> {
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
    visibleDate?: DateSupportedShape;
    /**
     * The date used to decide which month should be initially displayed in the Days Grid and which year should be initially displayed in the Months List and Months Grid.
     * To render a controlled (Range)Calendar, use the `visibleDate` prop instead.
     */
    defaultVisibleDate?: DateSupportedShape;
    /**
     * Event handler called when the visible date changes.
     * Provides the new visible date as an argument.
     * @param {DateSupportedShape} visibleDate The new visible date.
     */
    onVisibleDateChange?: (visibleDate: DateSupportedShape) => void;
    /**
     * The date used to generate the new value when both `value` and `defaultValue` are empty.
     * @default The closest valid date using the validation props, except callbacks such as `shouldDisableDate`.
     */
    referenceDate?: DateSupportedShape;
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
    TValue extends DateSupportedValue,
    TError,
    TValidationProps extends Required<BaseDateValidationProps>,
  > extends PublicParameters<TValue, TError> {
    /**
     * The manager of the calendar (uses `useDateManager` for Calendar and `useDateRangeManager` for RangeCalendar).
     */
    manager: PickerManager<TValue, any, TError, any, any>;
    /**
     * The methods needed to manage the value of the calendar.
     * It helps sharing the code between the Calendar and the RangeCalendar.
     */
    calendarValueManager: ValueManager<TValue>;
    /**
     * The props used to validate a single date.
     */
    dateValidationProps: ValidateDateProps;
    /**
     * The props used to validate the value.
     */
    valueValidationProps: TValidationProps;
  }

  export interface ReturnValue<TValue extends DateSupportedValue> {
    value: TValue;
    referenceDate: DateSupportedShape;
    setValue: (
      newValue: TValue,
      options: { section: BaseCalendarSection; changeImportance: 'set' | 'accept' },
    ) => void;
    setVisibleDate: (newVisibleDate: DateSupportedShape, skipIfAlreadyVisible: boolean) => void;
    isDateCellVisible: (date: DateSupportedShape) => boolean;
    context: BaseCalendarRootContext;
    visibleDateContext: BaseCalendarRootVisibleDateContext;
  }

  export interface ValueChangeHandlerContext<TError> {
    /**
     * The section handled by the UI that triggered the change.
     */
    section: BaseCalendarSection;
    /**
     * The validation error associated to the new value.
     */
    validationError: TError;
    /**
     * The importance of the change.
     */
    changeImportance: PickerChangeImportance;
  }

  export interface RegisterSectionParameters {
    type: BaseCalendarSection;
    value: DateSupportedShape;
  }

  export interface ValueManager<TValue extends DateSupportedValue> {
    /**
     * TODO: Write description.
     * @param {TValue} value The value to get the reference date from.
     * @returns {DateSupportedShape | null} The initial visible date.
     */
    getDateToUseForReferenceDate: (value: TValue) => DateSupportedShape | null;
    /**
     * TODO: Write description.
     * @param {OnSelectDateParameters} parameters The parameters to get the new value from the new selected date.
     */
    onSelectDate: (parameters: OnSelectDateParameters<TValue>) => void;
    /**
     * TODO: Write description.
     * @param {TValue} value The current value.
     * @returns {DateSupportedShape | null} The current date.
     */
    getCurrentDateFromValue: (value: TValue) => DateSupportedShape | null;
    /**
     * TODO: Write description.
     * @param {TValue} value The current value.
     * @returns {DateSupportedShape[]} The selected dates.
     */
    getSelectedDatesFromValue: (value: TValue) => DateSupportedShape[];
  }

  export interface OnSelectDateParameters<TValue extends DateSupportedValue> {
    setValue: (
      value: TValue,
      options: { section: BaseCalendarSection; changeImportance: 'set' | 'accept' },
    ) => void;
    /**
     * The value before the change.
     */
    prevValue: TValue;
    /**
     * The date to select.
     */
    selectedDate: DateSupportedShape;
    /**
     * The reference date.
     */
    referenceDate: DateSupportedShape;
    /**
     * The section handled by the UI that triggered the change.
     */
    section: BaseCalendarSection;
  }
}

export function useAddDefaultsToBaseDateValidationProps(
  validationDate: BaseDateValidationProps,
): Required<BaseDateValidationProps> {
  const utils = useUtils();
  const defaultDates = useDefaultDates();

  const { disablePast, disableFuture, minDate = null, maxDate = null } = validationDate;

  return React.useMemo(() => {
    let cleanMinDate = utils.isValid(minDate) ? minDate : defaultDates.minDate;
    if (disablePast) {
      const current = utils.date();
      if (utils.isBefore(cleanMinDate, current)) {
        cleanMinDate = current;
      }
    }

    let cleanMaxDate = utils.isValid(maxDate) ? maxDate : defaultDates.maxDate;
    if (disableFuture) {
      const current = utils.date();
      if (utils.isAfter(cleanMaxDate, current)) {
        cleanMaxDate = current;
      }
    }

    return {
      // TODO: Remove disableFuture and disablePast from `validateDate`.
      disablePast: false,
      disableFuture: false,
      minDate: cleanMinDate,
      maxDate: cleanMaxDate,
    };
  }, [disablePast, disableFuture, minDate, maxDate, utils, defaultDates]);
}
