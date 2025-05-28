'use client';
import * as React from 'react';
import { TemporalSupportedObject, TemporalNonRangeValue } from '../../models';
import { validateDate } from '../../utils/temporal/validateDate';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { useSharedCalendarRoot } from './useSharedCalendarRoot';
import { SharedCalendarRootVisibleDateContext } from './SharedCalendarRootVisibleDateContext';
import {
  useApplyDefaultValuesToDateValidationProps,
  useDateManager,
} from '../../utils/temporal/useDateManager';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, PartialPick } from '../../utils/types';

const calendarValueManager: useSharedCalendarRoot.ValueManager<TemporalNonRangeValue> = {
  getDateToUseForReferenceDate: (value) => value,
  onSelectDate: ({ setValue, selectedDate, section }) =>
    setValue(selectedDate, {
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
    shouldDisableDate,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();
  const manager = useDateManager();

  const baseDateValidationProps = useApplyDefaultValuesToDateValidationProps({
    minDate,
    maxDate,
  });

  const validationProps = React.useMemo<validateDate.ValidationProps>(
    () => ({
      ...baseDateValidationProps,
      shouldDisableDate,
    }),
    [baseDateValidationProps, shouldDisableDate],
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

  const [prevValue, setPrevValue] = React.useState<TemporalNonRangeValue>(value);
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
    <SharedCalendarRootVisibleDateContext.Provider value={visibleDateContext}>
      <SharedCalendarRootContext.Provider value={baseContext}>
        {element}
      </SharedCalendarRootContext.Provider>
    </SharedCalendarRootVisibleDateContext.Provider>
  );
});

export namespace CalendarRoot {
  export interface State {}

  export interface Props
    extends Omit<
        BaseUIComponentProps<'div', State>,
        'value' | 'defaultValue' | 'onError' | 'children'
      >,
      useSharedCalendarRoot.PublicParameters<TemporalNonRangeValue, validateDate.Error>,
      PartialPick<validateDate.ValidationProps, 'minDate' | 'maxDate'> {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the public context as its parameter.
     */
    children?: React.ReactNode | ((parameters: ChildrenParameters) => React.ReactNode);
  }

  export interface ChildrenParameters {
    visibleDate: TemporalSupportedObject;
  }

  export interface ValueChangeHandlerContext
    extends useSharedCalendarRoot.ValueChangeHandlerContext<validateDate.Error> {}
}
