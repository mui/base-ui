import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { Store, useStore } from '@base-ui-components/utils/store';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../types/temporal';
import { mergeDateAndTime } from '../../utils/temporal/date-helpers';
import { validateDate } from '../../utils/temporal/validateDate';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { TemporalManager, TemporalTimezoneProps } from '../../utils/temporal/types';
import { selectors, SharedCalendarStore, CalendarState } from '../store';
import { useAssertModelConsistency } from '../../utils/useAssertModelConsistency';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import type { CalendarRoot } from './CalendarRoot';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';

export function useSharedCalendarRoot<TValue extends TemporalSupportedValue, TError>(
  parameters: useSharedCalendarRoot.Parameters<TValue, TError>,
): useSharedCalendarRoot.ReturnValue {
  const adapter = useTemporalAdapter();

  const {
    // Form props
    readOnly = false,
    disabled = false,
    invalid,
    // Focus and navigation props
    monthPageSize = 1,
    // Value props
    defaultValue,
    onValueChange,
    value: valueProp,
    timezone: timezoneProp,
    referenceDate: referenceDateProp = null,
    // Visible date props
    onVisibleDateChange,
    visibleDate: visibleDateProp,
    defaultVisibleDate,
    // Validation props
    isDateUnavailable,
    minDate,
    maxDate,
    // Manager props
    manager,
    calendarValueManager: { getDateToUseForReferenceDate, onSelectDate, getActiveDateFromValue },
  } = parameters;

  useAssertModelConsistency({
    componentName: '(Range)Calendar',
    propName: 'value',
    controlled: valueProp,
    defaultValue: defaultValue ?? manager.emptyValue,
  });

  useAssertModelConsistency({
    componentName: '(Range)Calendar',
    propName: 'visibleDate',
    controlled: visibleDateProp,
    defaultValue: defaultVisibleDate ?? null,
  });

  const store = useRefWithInit(() => {
    const value = valueProp ?? defaultValue ?? manager.emptyValue;
    const initialReferenceDateFromValue = getDateToUseForReferenceDate(value);

    let initialVisibleDate: TemporalSupportedObject;
    if (visibleDateProp) {
      initialVisibleDate = visibleDateProp;
    } else if (defaultVisibleDate) {
      initialVisibleDate = defaultVisibleDate;
    } else {
      initialVisibleDate = getInitialReferenceDate({
        adapter,
        precision: 'day',
        timezone: timezoneProp ?? 'default',
        validationProps: { minDate, maxDate },
        externalReferenceDate: referenceDateProp,
        externalDate: initialReferenceDateFromValue,
      });
    }

    return new Store<CalendarState<TValue>>({
      adapter,
      manager,
      visibleDate: initialVisibleDate,
      initialReferenceDateFromValue,
      value,
      timezoneProp,
      referenceDateProp,
      validationProps: { minDate, maxDate },
      isDateUnavailable,
      disabled,
      monthPageSize,
      navigationDirection: 'none',
    });
  }).current;
  const validationProps = useStore(store, selectors.validationProps);
  const value = useStore(store, selectors.valueWithTimezoneToRender);
  const referenceDate = useStore(store, selectors.referenceDate);
  const visibleDate = useStore(store, selectors.visibleDate);
  const navigationDirection = useStore(store, selectors.navigationDirection);

  const setValue = useEventCallback(
    (newValue: TValue, event: React.MouseEvent<HTMLButtonElement>) => {
      const inputTimezone = manager.getTimezone(store.state.value);
      const newValueWithInputTimezone =
        inputTimezone == null ? newValue : manager.setTimezone(newValue, inputTimezone);

      const eventDetails = createChangeEventDetails(
        'day-press',
        event.nativeEvent,
        event.currentTarget,
        {
          getValidationError: () =>
            manager.getValidationError(newValueWithInputTimezone, store.state.validationProps),
        },
      );
      onValueChange?.(newValueWithInputTimezone, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      store.set('value', newValueWithInputTimezone);
    },
  );

  const isInvalid = React.useMemo(() => {
    if (invalid != null) {
      return invalid;
    }

    const error = manager.getValidationError(value, validationProps);
    return manager.isValidationErrorEmpty(error);
  }, [manager, value, invalid, validationProps]);

  const dayGridsRef = React.useRef<Record<number, TemporalSupportedObject>>({});
  const currentMonthDayGridRef = React.useRef<Record<number, TemporalSupportedObject[]>>(null);

  const registerDayGrid = useEventCallback((month: TemporalSupportedObject) => {
    const id = Math.random();
    dayGridsRef.current![id] = month;

    return () => {
      delete dayGridsRef.current[id];
    };
  });

  const registerCurrentMonthDayGrid = useEventCallback(
    (week: TemporalSupportedObject, days: TemporalSupportedObject[]) => {
      if (currentMonthDayGridRef.current == null) {
        currentMonthDayGridRef.current = {};
      }
      const weekTime = adapter.toJsDate(week).getTime();
      if (currentMonthDayGridRef.current[weekTime] == null) {
        currentMonthDayGridRef.current[weekTime] = days;
      }
      return () => {
        delete currentMonthDayGridRef.current?.[weekTime];
      };
    },
  );

  const isDateCellVisible = (date: TemporalSupportedObject) => {
    if (Object.values(dayGridsRef.current).length > 0) {
      return Object.values(dayGridsRef.current).every((month) => !adapter.isSameMonth(date, month));
    }

    return true;
  };

  const handleVisibleDateChange = useEventCallback(
    (newVisibleDate: TemporalSupportedObject, skipIfAlreadyVisible: boolean) => {
      if (skipIfAlreadyVisible && isDateCellVisible(newVisibleDate)) {
        return;
      }
      const currentMonth = adapter.getTime(visibleDate);
      onVisibleDateChange?.(newVisibleDate);
      store.set('visibleDate', newVisibleDate);

      const newMonth = adapter.getTime(newVisibleDate);
      let newNavigationDirection: CalendarRoot.NavigationDirection = 'none';
      if (newMonth < currentMonth) {
        newNavigationDirection = 'previous';
      } else if (newMonth > currentMonth) {
        newNavigationDirection = 'next';
      }
      store.set('navigationDirection', newNavigationDirection);
    },
  );

  const [prevValue, setPrevValue] = React.useState<TValue>(value);
  React.useEffect(() => {
    if (!adapter.isEqual(value, prevValue)) {
      setPrevValue(value);
      const activeDate = getActiveDateFromValue(value);
      if (adapter.isValid(activeDate)) {
        handleVisibleDateChange(activeDate, true);
      }
    }
  }, [value, prevValue, getActiveDateFromValue, adapter, handleVisibleDateChange]);

  const selectDate = useEventCallback<SharedCalendarRootContext['selectDate']>(
    (selectedDate: TemporalSupportedObject, event: React.MouseEvent<HTMLButtonElement>) => {
      if (readOnly) {
        return;
      }

      const activeDate = getActiveDateFromValue(value) ?? referenceDate;
      const cleanSelectedDate = mergeDateAndTime(adapter, selectedDate, activeDate);

      onSelectDate({
        setValue: (newValue) => setValue(newValue, event),
        prevValue: value,
        selectedDate: cleanSelectedDate,
        referenceDate,
      });
    },
  );

  // const changePage: NavigateInGridChangePage = (params) => {
  //   // TODO: Jump over months with no valid date.
  //   if (params.direction === 'previous') {
  //     const targetDate = adapter.addMonths(adapter.startOfMonth(visibleDate), -monthPageSize);
  //     const lastMonthInNewPage = adapter.addMonths(targetDate, monthPageSize - 1);

  //     // All the months before the visible ones are fully disabled, we skip the navigation.
  //     if (
  //       validationProps.minDate != null &&
  //       adapter.isAfter(adapter.startOfMonth(validationProps.minDate), lastMonthInNewPage)
  //     ) {
  //       return;
  //     }

  //     setVisibleDate(adapter.addMonths(visibleDate, -monthPageSize));
  //   }
  //   if (params.direction === 'next') {
  //     const targetDate = adapter.addMonths(adapter.startOfMonth(visibleDate), monthPageSize);

  //     // All the months after the visible ones are fully disabled, we skip the navigation.
  //     if (
  //       validationProps.maxDate != null &&
  //       adapter.isBefore(adapter.startOfMonth(validationProps.maxDate), targetDate)
  //     ) {
  //       return;
  //     }
  //     setVisibleDate(adapter.addMonths(visibleDate, monthPageSize));
  //   }

  //   pageNavigationTargetRef.current = params.target;
  // };

  const state: useSharedCalendarRoot.State = React.useMemo(
    () => ({
      empty: manager.areValuesEqual(value, manager.emptyValue),
      invalid: isInvalid,
      disabled,
      readOnly,
      navigationDirection,
    }),
    [manager, value, isInvalid, disabled, readOnly, navigationDirection],
  );

  const context: SharedCalendarRootContext = React.useMemo(
    () => ({
      store,
      setVisibleDate: handleVisibleDateChange,
      registerDayGrid,
      registerCurrentMonthDayGrid,
      currentMonthDayGridRef,
      selectDate,
    }),
    [store, handleVisibleDateChange, registerDayGrid, registerCurrentMonthDayGrid, selectDate],
  );

  useIsoLayoutEffect(() => {
    store.apply({
      adapter,
      manager,
      timezoneProp,
      referenceDateProp,
      value: valueProp ?? defaultValue ?? manager.emptyValue,
      disabled,
      isDateUnavailable,
      monthPageSize,
    });
  }, [
    store,
    adapter,
    manager,
    timezoneProp,
    referenceDateProp,
    valueProp,
    defaultValue,
    disabled,
    isDateUnavailable,
    monthPageSize,
  ]);

  useIsoLayoutEffect(() => {
    store.set('validationProps', { minDate, maxDate });
  }, [store, minDate, maxDate]);

  return {
    state,
    context,
    store,
  };
}

export namespace useSharedCalendarRoot {
  export interface PublicParameters<TValue extends TemporalSupportedValue>
    extends TemporalTimezoneProps,
      validateDate.ValidationProps {
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
     * Has `getValidationError()` in the `eventDetails` to retrieve the validation error associated to the new value.
     */
    onValueChange?: (value: TValue, eventDetails: CalendarRoot.ChangeEventDetails) => void;
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
     * The date used to decide which month should be displayed in the Day Grid.
     * To render an uncontrolled Calendar, use the `defaultVisibleDate` prop instead.
     */
    visibleDate?: TemporalSupportedObject;
    /**
     * The date used to decide which month should be initially displayed in the Day Grid.
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
     * @default 'The closest valid date using the validation props.'
     */
    referenceDate?: TemporalSupportedObject;
    /**
     * The amount of months to move by when navigating.
     * This is mostly useful when displaying multiple day grids.
     * @default 1
     */
    monthPageSize?: number;
  }

  export interface Parameters<TValue extends TemporalSupportedValue, TError>
    extends PublicParameters<TValue> {
    /**
     * The manager of the calendar (uses `useDateManager` for Calendar and `useDateRangeManager` for RangeCalendar).
     */
    manager: TemporalManager<TValue, TError, any>;
    /**
     * The methods needed to manage the value of the calendar.
     * It helps sharing the code between the Calendar and the RangeCalendar.
     */
    calendarValueManager: ValueManager<TValue>;
  }

  export interface ReturnValue {
    state: State;
    context: SharedCalendarRootContext;
    store: SharedCalendarStore;
  }

  export interface ValueChangeHandlerContext<TError> {
    /**
     * The validation error associated to the new value.
     */
    getValidationError: () => TError;
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

  export interface CellRefs {
    cell: React.RefObject<HTMLButtonElement | null>;
    row: React.RefObject<HTMLDivElement | null>;
    grid: React.RefObject<HTMLElement | null>;
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
    /**
     * The direction of the navigation (based on the month navigating to).
     */
    navigationDirection: CalendarRoot.NavigationDirection;
  }
}
