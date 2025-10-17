'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { BaseUIChangeEventDetails } from '@base-ui-components/react/types';
import { TemporalNonRangeValue } from '../../types/temporal';
import { SharedCalendarRootContext } from './SharedCalendarRootContext';
import { useSharedCalendarRoot } from './useSharedCalendarRoot';
import { useDateManager } from '../../utils/temporal/useDateManager';
import { CalendarContext } from '../use-context/CalendarContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { selectors } from '../store';
import { CalendarRootDataAttributes } from './CalendarRootDataAttributes';

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

const calendarValueManager: useSharedCalendarRoot.ValueManager<TemporalNonRangeValue> = {
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

  const {
    store,
    state,
    context: sharedContext,
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
    visibleDate: visibleDateProp,
    defaultVisibleDate,
    manager,
    isDateUnavailable,
    minDate,
    maxDate,
    calendarValueManager,
  });

  const visibleDate = useStore(store, selectors.visibleDate);
  const visibleMonth = useStore(store, selectors.visibleMonth);
  const publicContext: CalendarContext = React.useMemo(() => ({ visibleDate }), [visibleDate]);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children(publicContext);
    }

    return children;
  }, [children, publicContext]);

  // TODO: Improve localization support (right now it doesn't work well with RTL languages)
  const ariaLabel = React.useMemo(() => {
    const formattedVisibleMonth = adapter.format(visibleMonth, 'fullMonthAndYear').toLowerCase();
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
    <CalendarContext.Provider value={publicContext}>
      <SharedCalendarRootContext.Provider value={sharedContext}>
        {element}
      </SharedCalendarRootContext.Provider>
    </CalendarContext.Provider>
  );
});

export namespace CalendarRoot {
  export type NavigationDirection = 'previous' | 'next' | 'none';

  export interface State extends useSharedCalendarRoot.State {}

  export interface Props
    extends Omit<BaseUIComponentProps<'div', State>, 'children'>,
      useSharedCalendarRoot.PublicParameters<TemporalNonRangeValue> {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the public context as its parameter.
     */
    children?: React.ReactNode | ((parameters: CalendarContext) => React.ReactNode);
  }

  export interface ValueChangeHandlerContext
    extends useSharedCalendarRoot.ValueChangeHandlerContext<any> {}

  export type ChangeEventReason = 'day-press' | 'none';
  export type ChangeEventDetails = BaseUIChangeEventDetails<
    ChangeEventReason,
    ValueChangeHandlerContext
  >;
}
