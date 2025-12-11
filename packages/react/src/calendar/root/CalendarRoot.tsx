'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { TemporalValue } from '../../types/temporal';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { useDateManager } from '../../utils/temporal/useDateManager';
import { CalendarContext } from '../use-context/CalendarContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { formatMonthFullLetterAndYear } from '../../utils/temporal/date-helpers';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import {
  CalendarNavigationDirection,
  CalendarValueChangeHandlerContext,
  selectors,
  CalendarRootElementState,
  ValueManager,
  SharedCalendarStore,
  SharedCalendarStoreParameters,
  CalendarChangeEventReason,
  CalendarValueChangeEventDetails,
  CalendarVisibleDateChangeEventDetails,
} from '../store';
import { CalendarRootDataAttributes } from './CalendarRootDataAttributes';
import { validateDate } from '../../utils/temporal/validateDate';

const stateAttributesMapping: StateAttributesMapping<CalendarRoot.State> = {
  navigationDirection: (direction) => {
    if (direction === 'none') {
      return null;
    }
    return {
      [CalendarRootDataAttributes.navigationDirection]: direction,
    };
  },
};

const calendarValueManager: ValueManager<TemporalValue> = {
  getDateToUseForReferenceDate: (value) => value,
  onSelectDate: ({ setValue, selectedDate }) => setValue(selectedDate),
  getActiveDateFromValue: (value) => value,
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
    visibleDate: visibleDateProp,
    defaultVisibleDate,
    // Children
    children,
    // Validation props
    minDate,
    maxDate,
    isDateUnavailable,
    // Accessibility props
    'aria-label': ariaLabelProp,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const manager = useDateManager();
  const adapter = useTemporalAdapter();

  const parameters = React.useMemo(
    () => ({
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
      visibleDate: visibleDateProp,
      defaultVisibleDate,
      isDateUnavailable,
      minDate,
      maxDate,
    }),
    [
      readOnly,
      disabled,
      invalid,
      monthPageSize,
      onValueChange,
      defaultValue,
      valueProp,
      timezone,
      referenceDate,
      onVisibleDateChange,
      visibleDateProp,
      defaultVisibleDate,
      isDateUnavailable,
      minDate,
      maxDate,
    ],
  );

  const store = useRefWithInit(
    () => new SharedCalendarStore(parameters, adapter, manager, calendarValueManager),
  ).current;

  useIsoLayoutEffect(() => {
    store.updateStateFromParameters(parameters, adapter, manager);
  }, [store, parameters, adapter, manager]);

  const visibleMonth = useStore(store, selectors.visibleMonth);
  const state: CalendarRoot.State = useStore(store, selectors.rootElementState);
  const publicContext = useStore(store, selectors.publicContext);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children(publicContext);
    }

    return children;
  }, [children, publicContext]);

  // TODO: Improve localization support (right now it doesn't work well with RTL languages)
  const ariaLabel = React.useMemo(() => {
    const formattedVisibleMonth = formatMonthFullLetterAndYear(adapter, visibleMonth).toLowerCase();
    const prefix = ariaLabelProp ? `${ariaLabelProp}, ` : '';

    return `${prefix}${formattedVisibleMonth}`;
  }, [adapter, ariaLabelProp, visibleMonth]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ children: resolvedChildren, 'aria-label': ariaLabel }, elementProps],
    stateAttributesMapping,
  });

  return (
    <SharedCalendarRootContext.Provider value={store}>{element}</SharedCalendarRootContext.Provider>
  );
});

export namespace CalendarRoot {
  export type NavigationDirection = CalendarNavigationDirection;

  export interface State extends CalendarRootElementState {}

  export interface Props
    extends
      Omit<BaseUIComponentProps<'div', State>, 'children'>,
      SharedCalendarStoreParameters<TemporalValue, validateDate.ReturnValue> {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the public context as its parameter.
     */
    children?: React.ReactNode | ((parameters: CalendarContext) => React.ReactNode);
  }

  export interface ValueChangeHandlerContext extends CalendarValueChangeHandlerContext<validateDate.ReturnValue> {}

  export type ChangeEventReason = CalendarChangeEventReason;

  export type ValueChangeEventDetails = CalendarValueChangeEventDetails<validateDate.ReturnValue>;

  export type VisibleDateChangeEventDetails = CalendarVisibleDateChangeEventDetails;
}
