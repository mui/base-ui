'use client';
import * as React from 'react';
import { TemporalNonRangeValue } from '../../models';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { useSharedCalendarRoot } from './useSharedCalendarRoot';
import { SharedCalendarRootVisibleDateContext } from './SharedCalendarRootVisibleDateContext';
import { useDateManager } from '../../utils/temporal/useDateManager';
import { CalendarContext } from '../use-context/CalendarContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { validateDate } from '../../utils/temporal/date-helpers';

const calendarValueManager: useSharedCalendarRoot.ValueManager<TemporalNonRangeValue> = {
  getDateToUseForReferenceDate: (value) => value,
  onSelectDate: ({ setValue, selectedDate }) => setValue(selectedDate),
  getActiveDateFromValue: (value) => value,
  getSelectedDatesFromValue: (value) => (value == null ? [] : [value]),
};

/**
 * Groups all parts of the calendar.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
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

  const manager = useDateManager();

  const {
    state,
    context: sharedContext,
    visibleDateContext,
  } = useSharedCalendarRoot({
    readOnly,
    disabled,
    invalid,
    monthPageSize,
    onValueChange,
    defaultValue,
    value: valueProp,
    timezone,
    referenceDate,
    onVisibleDateChange,
    visibleDate,
    defaultVisibleDate,
    manager,
    isDateUnavailable,
    minDate,
    maxDate,
    calendarValueManager,
  });

  const publicContext: CalendarContext = React.useMemo(
    () => ({
      visibleDate: visibleDateContext.visibleDate,
    }),
    [visibleDateContext.visibleDate],
  );

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children(publicContext);
    }

    return children;
  }, [children, publicContext]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ children: resolvedChildren }, elementProps],
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
    extends Omit<BaseUIComponentProps<'div', State>, 'children'>,
      useSharedCalendarRoot.PublicParameters<TemporalNonRangeValue, validateDate.ReturnValue> {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the public context as its parameter.
     */
    children?: React.ReactNode | ((parameters: CalendarContext) => React.ReactNode);
  }

  export interface ValueChangeHandlerContext
    extends useSharedCalendarRoot.ValueChangeHandlerContext<validateDate.ReturnValue> {}
}
