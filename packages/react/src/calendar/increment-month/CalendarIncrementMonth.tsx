'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { selectors } from '../store';
import { useCalendarMonthButton } from '../utils/useCalendarMonthButton';

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
  const { className, render, nativeButton, disabled, ...elementProps } = componentProps;

  const store = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const monthPageSize = useStore(store, selectors.monthPageSize);
  const visibleDate = useStore(store, selectors.visibleDate);

  const targetDate = React.useMemo(
    () => adapter.addMonths(visibleDate, monthPageSize),
    [visibleDate, monthPageSize, adapter],
  );

  const isDisabled = useStore(store, selectors.isSetMonthButtonDisabled, disabled, targetDate);

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
  });

  const { pointerHandlers, autoChangeButtonRef } = useCalendarMonthButton({
    direction: 1,
    disabled: isDisabled,
    store,
    adapter,
    monthPageSize,
  });

  const state: CalendarIncrementMonth.State = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, autoChangeButtonRef, forwardedRef],
    props: [
      {
        tabIndex: 0,
        'aria-label': monthPageSize > 1 ? 'Next months' : 'Next month',
        onClick(event) {
          // Skip for pointer clicks — onPointerDown already handled the first navigation.
          // Keep for keyboard activation (Enter/Space) where detail === 0.
          if (isDisabled || event.detail !== 0) {
            return;
          }
          store.setVisibleDate(
            targetDate,
            event.nativeEvent,
            event.currentTarget as HTMLElement,
            'month-change',
          );
        },
        ...pointerHandlers,
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
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
