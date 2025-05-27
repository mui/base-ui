'use client';
import * as React from 'react';
import { DateSupportedShape, DateNonRangeValue } from '../../models';
import { DateValidationError } from '../../../../models';
import { BaseCalendarRootContext } from '../../utils/base-calendar/root/BaseCalendarRootContext';
import {
  useSharedCalendarRoot,
  useAddDefaultsToBaseDateValidationProps,
} from '../../utils/date-and-time/shared-calendar/root/useSharedCalendarRoot';
import { BaseCalendarRootVisibleDateContext } from '../../utils/base-calendar/root/BaseCalendarRootVisibleDateContext';
import { useDateManager } from '../../../../managers';
import { ExportedValidateDateProps, ValidateDateProps } from '../../../../validation/validateDate';
import { useDateAdapter } from '../../date-adapter-provider/DateAdapterContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';

const calendarValueManager: useBaseCalendarRoot.ValueManager<DateNonRangeValue> = {
  getDateToUseForReferenceDate: (value) => value,
  onSelectDate: ({ setValue, selectedDate, section }) =>
    setValue(selectedDate, {
      changeImportance: 'accept',
      section,
    }),
  getCurrentDateFromValue: (value) => value,
  getSelectedDatesFromValue: (value) => (value == null ? [] : [value]),
};

export const CalendarRoot = React.forwardRef(function CalendarRoot(
  componentProps: CalendarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    // Form props
    readOnly,
    disabled,
    // Focus and navigation props
    monthPageSize,
    yearPageSize,
    // Value props
    onValueChange,
    defaultValue,
    value: valueProp,
    timezone,
    referenceDate,
    // Visible date props
    onVisibleDateChange,
    visibleDate,
    defaultVisibleDate,
    // Children
    children,
    // Validation props
    onError,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useDateAdapter();
  const manager = useDateManager();

  const baseDateValidationProps = useAddDefaultsToBaseDateValidationProps({
    minDate,
    maxDate,
    disablePast,
    disableFuture,
  });

  const validationProps = React.useMemo<ValidateDateProps>(
    () => ({
      ...baseDateValidationProps,
      shouldDisableDate,
      shouldDisableMonth,
      shouldDisableYear,
    }),
    [baseDateValidationProps, shouldDisableDate, shouldDisableMonth, shouldDisableYear],
  );

  const {
    value,
    setVisibleDate,
    isDateCellVisible,
    context: baseContext,
    visibleDateContext,
  } = useSharedCalendarRoot({
    readOnly,
    disabled,
    monthPageSize,
    yearPageSize,
    onValueChange,
    defaultValue,
    value: valueProp,
    timezone,
    referenceDate,
    onVisibleDateChange,
    visibleDate,
    defaultVisibleDate,
    onError,
    manager,
    dateValidationProps: validationProps,
    valueValidationProps: validationProps,
    calendarValueManager,
  });

  const [prevValue, setPrevValue] = React.useState<DateNonRangeValue>(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (adapter.isValid(value) && isDateCellVisible(value)) {
      setVisibleDate(value, false);
    }
  }

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children({ visibleDate: visibleDateContext.visibleDate });
    }

    return children;
  }, [children, visibleDateContext.visibleDate]);

  const props = React.useMemo(() => ({ children: resolvedChildren }), [resolvedChildren]);

  const isEmpty = value == null;
  const state: CalendarRoot.State = React.useMemo(() => ({ empty: isEmpty }), [isEmpty]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
  });

  return (
    <BaseCalendarRootVisibleDateContext.Provider value={visibleDateContext}>
      <BaseCalendarRootContext.Provider value={baseContext}>
        {element}
      </BaseCalendarRootContext.Provider>
    </BaseCalendarRootVisibleDateContext.Provider>
  );
});

export namespace CalendarRoot {
  export interface State {}

  export interface Props
    extends Omit<
        BaseUIComponentProps<'div', State>,
        'value' | 'defaultValue' | 'onError' | 'children'
      >,
      useBaseCalendarRoot.PublicParameters<DateNonRangeValue, DateValidationError>,
      ExportedValidateDateProps {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the public context as its parameter.
     */
    children?: React.ReactNode | ((parameters: ChildrenParameters) => React.ReactNode);
  }

  export interface ChildrenParameters {
    visibleDate: DateSupportedShape;
  }

  export interface ValueChangeHandlerContext
    extends useBaseCalendarRoot.ValueChangeHandlerContext<DateValidationError> {}
}
