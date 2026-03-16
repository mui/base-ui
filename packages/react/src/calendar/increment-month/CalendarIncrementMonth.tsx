'use client';
import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useCalendarSetMonthButton } from '../utils/useCalendarSetMonthButton';

/**
 * Displays an element to navigate to the next month in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarIncrementMonth = React.forwardRef(function CalendarIncrementMonth(
  componentProps: CalendarIncrementMonth.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return useCalendarSetMonthButton({
    direction: 1,
    ariaLabel: { singular: 'Next month', plural: 'Next months' },
    componentProps,
    forwardedRef,
  });
});

export interface CalendarIncrementMonthState {
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
}

export interface CalendarIncrementMonthProps
  extends BaseUIComponentProps<'button', CalendarIncrementMonthState>, NativeButtonProps {}

export namespace CalendarIncrementMonth {
  export type State = CalendarIncrementMonthState;
  export type Props = CalendarIncrementMonthProps;
}
