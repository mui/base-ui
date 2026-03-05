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
import { REASONS } from '../../utils/reasons';

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
  const {
    className,
    render,
    nativeButton,
    disabled: disabledProp,
    focusableWhenDisabled = true,
    ...elementProps
  } = componentProps;

  const store = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const monthPageSize = useStore(store, selectors.monthPageSize);
  const visibleDate = useStore(store, selectors.visibleDate);

  const targetDate = React.useMemo(
    () => adapter.addMonths(visibleDate, -monthPageSize),
    [visibleDate, monthPageSize, adapter],
  );

  const isDisabled = useStore(
    store,
    selectors.isSetMonthButtonDisabled,
    disabledProp,
    targetDate,
    disabledProp,
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
    focusableWhenDisabled,
  });

  const { pointerHandlers, autoChangeButtonRef } = useCalendarMonthButton({
    direction: -1,
    disabled: isDisabled,
    disabledProp,
    store,
    adapter,
    monthPageSize,
  });

  const state: CalendarDecrementMonth.State = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, autoChangeButtonRef, forwardedRef],
    props: [
      {
        tabIndex: 0,
        'aria-label': monthPageSize > 1 ? 'Previous months' : 'Previous month',
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
            REASONS.monthChange,
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

export interface CalendarDecrementMonthState {
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
}

export interface CalendarDecrementMonthProps
  extends BaseUIComponentProps<'button', CalendarDecrementMonthState>, NativeButtonProps {
  /**
   * When `true` the button remains focusable when disabled.
   * @default true
   */
  focusableWhenDisabled?: boolean | undefined;
}

export namespace CalendarDecrementMonth {
  export type State = CalendarDecrementMonthState;
  export type Props = CalendarDecrementMonthProps;
}
