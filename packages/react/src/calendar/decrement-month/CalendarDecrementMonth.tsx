'use client';
import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useCalendarSetMonthButton } from '../utils/useCalendarSetMonthButton';

/**
 * Displays an element to navigate to the previous month in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */

export const CalendarDecrementMonth = React.forwardRef(function CalendarDecrementMonth(
  componentProps: CalendarDecrementMonth.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return useCalendarSetMonthButton({
    direction: -1,
    ariaLabel: { singular: 'Previous month', plural: 'Previous months' },
    componentProps,
    forwardedRef,
  });
});

export interface CalendarDecrementMonthState {
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
}

export interface CalendarDecrementMonthProps
  extends BaseUIComponentProps<'button', CalendarDecrementMonthState>, NativeButtonProps {}

export namespace CalendarDecrementMonth {
  export type State = CalendarDecrementMonthState;
  export type Props = CalendarDecrementMonthProps;
}
