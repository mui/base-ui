'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { TemporalValue } from '../../types/temporal';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { getDateManager } from '../../utils/temporal/getDateManager';
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
import { ValidateDateReturnValue } from '../../utils/temporal/validateDate';

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

export const calendarValueManager: ValueManager<TemporalValue> = {
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
    value,
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
    // Accessibility props
    'aria-label': ariaLabelProp,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const adapter = useTemporalAdapter();
  const manager = React.useMemo(() => getDateManager(adapter), [adapter]);

  const parameters = React.useMemo(
    () => ({
      readOnly,
      disabled,
      invalid,
      monthPageSize,
      onValueChange,
      defaultValue,
      value,
      timezone,
      referenceDate,
      onVisibleDateChange,
      visibleDate,
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
      value,
      timezone,
      referenceDate,
      onVisibleDateChange,
      visibleDate,
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
    const formattedVisibleMonth = formatMonthFullLetterAndYear(adapter, visibleMonth);
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

export type CalendarRootNavigationDirection = CalendarNavigationDirection;

export interface CalendarRootState extends CalendarRootElementState {}

export interface CalendarRootProps
  extends
    Omit<BaseUIComponentProps<'div', CalendarRootState>, 'children'>,
    SharedCalendarStoreParameters<TemporalValue, ValidateDateReturnValue> {
  /**
   * The children of the component.
   * If a function is provided, it will be called with the public context as its parameter.
   */
  children?: React.ReactNode | ((parameters: CalendarContext) => React.ReactNode);
}

export interface CalendarRootValueChangeHandlerContext extends CalendarValueChangeHandlerContext<ValidateDateReturnValue> {}

export type CalendarRootChangeEventReason = CalendarChangeEventReason;

export type CalendarRootValueChangeEventDetails =
  CalendarValueChangeEventDetails<ValidateDateReturnValue>;

export type CalendarRootVisibleDateChangeEventDetails = CalendarVisibleDateChangeEventDetails;

export namespace CalendarRoot {
  export type NavigationDirection = CalendarRootNavigationDirection;
  export type State = CalendarRootState;
  export type Props = CalendarRootProps;
  export type ValueChangeHandlerContext = CalendarRootValueChangeHandlerContext;
  export type ChangeEventReason = CalendarRootChangeEventReason;
  export type ValueChangeEventDetails = CalendarRootValueChangeEventDetails;
  export type VisibleDateChangeEventDetails = CalendarRootVisibleDateChangeEventDetails;
}
