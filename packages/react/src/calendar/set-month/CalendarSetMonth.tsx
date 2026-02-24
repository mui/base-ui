'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { formatMonthFullLetterAndYear } from '../../utils/temporal/date-helpers';
import { useButton } from '../../use-button';
import { TemporalSupportedObject } from '../../types/temporal';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { selectors } from '../store';

/**
 * Displays an element to navigate to a given month in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarSetMonth = React.forwardRef(function CalendarSetMonth(
  componentProps: CalendarSetMonth.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, target, nativeButton, disabled, ...elementProps } = componentProps;

  const store = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const visibleDate = useStore(store, selectors.visibleDate);

  const targetDate = React.useMemo(
    () =>
      adapter.setYear(
        adapter.setMonth(visibleDate, adapter.getMonth(target)),
        adapter.getYear(target),
      ),
    [visibleDate, adapter, target],
  );

  const isDisabled = useStore(store, selectors.isSetMonthButtonDisabled, disabled, targetDate);

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
  });

  const state: CalendarSetMonth.State = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [
      {
        tabIndex: 0,
        'aria-label': formatMonthFullLetterAndYear(adapter, target),
        onClick(event) {
          if (isDisabled) {
            return;
          }
          store.setVisibleDate(
            targetDate,
            event.nativeEvent,
            event.currentTarget as HTMLElement,
            'month-change',
          );
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export interface CalendarSetMonthState {
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
}

export interface CalendarSetMonthProps
  extends BaseUIComponentProps<'button', CalendarSetMonthState>, NativeButtonProps {
  /**
   * The month to navigate to.
   */
  target: TemporalSupportedObject;
}

export namespace CalendarSetMonth {
  export type State = CalendarSetMonthState;
  export type Props = CalendarSetMonthProps;
}
