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
import { CalendarRootPublicContext } from './CalendarRootPublicContext';

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
    setVisibleDate,
    isDateCellVisible,
    context: sharedContext,
    visibleDateContext,
    isInvalid,
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

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children({ visibleDate: visibleDateContext.visibleDate });
    }

    return children;
  }, [children, visibleDateContext.visibleDate]);

  const props = React.useMemo(() => ({ children: resolvedChildren }), [resolvedChildren]);

  const isEmpty = value == null;
  const state: CalendarRoot.State = React.useMemo(
    () => ({ empty: isEmpty, invalid: isInvalid }),
    [isEmpty, isInvalid],
  );

  const publicContext: CalendarRootPublicContext = React.useMemo(
    () => ({
      visibleDate: visibleDateContext.visibleDate,
    }),
    [visibleDateContext.visibleDate],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
  });

  return (
    <CalendarRootPublicContext.Provider value={publicContext}>
      <SharedCalendarRootVisibleDateContext.Provider value={visibleDateContext}>
        <SharedCalendarRootContext.Provider value={sharedContext}>
          {element}
        </SharedCalendarRootContext.Provider>
      </SharedCalendarRootVisibleDateContext.Provider>
    </CalendarRootPublicContext.Provider>
  );
});

export namespace CalendarRoot {
  export interface State {
    /**
     * Whether the current value is empty.
     */
    empty: boolean;
    /**
     * Whether the current value is invalid.
     */
    invalid: boolean;
  }

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
