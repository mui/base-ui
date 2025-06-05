'use client';
import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useSharedCalendarRootVisibleDateContext } from '../root/SharedCalendarRootVisibleDateContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

/**
 * Displays an element to navigate to the next month in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarSetNextMonth = React.forwardRef(function CalendarSetNextMonth(
  componentProps: CalendarSetNextMonth.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, nativeButton, ...elementProps } = componentProps;

  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const {
    monthPageSize,
    disabled,
    validationProps: dateValidationProps,
    setVisibleDate,
  } = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();

  const targetDate = React.useMemo(
    () => adapter.addMonths(visibleDate, monthPageSize),
    [visibleDate, monthPageSize, adapter],
  );

  const isDisabled = React.useMemo(() => {
    if (disabled) {
      return true;
    }

    // All the months after the visible ones are fully disabled, we skip the navigation.
    return (
      dateValidationProps.maxDate != null &&
      adapter.isBefore(adapter.startOfMonth(dateValidationProps.maxDate), targetDate)
    );
  }, [disabled, dateValidationProps.maxDate, targetDate, adapter]);

  const setTarget = useEventCallback(() => {
    if (isDisabled) {
      return;
    }
    setVisibleDate(targetDate, false);
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
  });

  const state: CalendarSetNextMonth.State = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [
      { onClick: setTarget, tabIndex: 0, 'aria-label': 'Next' },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace CalendarSetNextMonth {
  export interface State {
    /**
     * Whether the button is disabled.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
