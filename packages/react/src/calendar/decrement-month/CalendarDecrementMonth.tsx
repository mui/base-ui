'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { selectors } from '../store';

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
  const { className, render, nativeButton, disabled, ...elementProps } = componentProps;

  const store = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const monthPageSize = useStore(store, selectors.monthPageSize);
  const visibleDate = useStore(store, selectors.visibleDate);

  const targetDate = React.useMemo(
    () => adapter.addMonths(visibleDate, -monthPageSize),
    [visibleDate, monthPageSize, adapter],
  );

  const isDisabled = useStore(store, selectors.isSetMonthButtonDisabled, disabled, targetDate);

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
  });

  const state: CalendarDecrementMonth.State = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [
      {
        tabIndex: 0,
        'aria-label': 'Previous',
        onClick(event) {
          if (isDisabled) {
            return;
          }
          store.setVisibleDate(targetDate, event, false);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
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
