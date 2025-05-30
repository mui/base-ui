'use client';
import * as React from 'react';
import { TemporalNonRangeValue } from '../../models';
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
import { BaseUIComponentProps } from '../../utils/types';
import { CalendarContext } from '../use-context/CalendarContext';

const calendarValueManager: useSharedCalendarRoot.ValueManager<TemporalNonRangeValue> = {
  getDateToUseForReferenceDate: (value) => value,
  onSelectDate: ({ setValue, selectedDate }) => setValue(selectedDate),
  getActiveDateFromValue: (value) => value,
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
    invalid,
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
    minDate,
    maxDate,
    isDateUnavailable,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();
  const manager = useDateManager();

  const validationProps = useApplyDefaultValuesToDateValidationProps({
    minDate,
    maxDate,
  });

  const {
    value,
    state,
    setVisibleDate,
    isDateCellVisible,
    context: sharedContext,
    visibleDateContext,
  } = useSharedCalendarRoot({
    readOnly,
    disabled,
    invalid,
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
    manager,
    dateValidationProps: validationProps,
    valueValidationProps: validationProps,
    isDateUnavailable,
    calendarValueManager,
  });

  const [prevValue, setPrevValue] = React.useState<TemporalNonRangeValue>(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (adapter.isValid(value) && isDateCellVisible(value)) {
      setVisibleDate(value, false);
    }
  }

  const publicContext: CalendarContext = React.useMemo(
    () => ({
      visibleDate: visibleDateContext.visibleDate,
    }),
    [visibleDateContext.visibleDate],
  );

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children({ visibleDate: visibleDateContext.visibleDate });
    }

    return children;
  }, [children, visibleDateContext.visibleDate]);

  const props = React.useMemo(() => ({ children: resolvedChildren }), [resolvedChildren]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
  });

  return (
    <CalendarContext.Provider value={publicContext}>
      <SharedCalendarRootVisibleDateContext.Provider value={visibleDateContext}>
        <SharedCalendarRootContext.Provider value={sharedContext}>
          {element}
        </SharedCalendarRootContext.Provider>
      </SharedCalendarRootVisibleDateContext.Provider>
    </CalendarContext.Provider>
  );
});

export namespace CalendarRoot {
  export interface State extends useSharedCalendarRoot.State {}

  export interface Props
    extends Omit<
        BaseUIComponentProps<'div', State>,
        'value' | 'defaultValue' | 'onError' | 'children'
      >,
      useSharedCalendarRoot.PublicParameters<TemporalNonRangeValue, validateDate.Error>,
      Partial<validateDate.ValidationProps> {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the public context as its parameter.
     */
    children?: React.ReactNode | ((parameters: CalendarContext) => React.ReactNode);
  }

  export interface ValueChangeHandlerContext
    extends useSharedCalendarRoot.ValueChangeHandlerContext<validateDate.Error> {}
}
