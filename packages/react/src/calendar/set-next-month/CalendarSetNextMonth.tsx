'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useStore } from '@base-ui-components/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { selectors } from '../store';

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
  const { className, render, nativeButton, disabled, ...elementProps } = componentProps;

  const { store, setVisibleDate } = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();
  const monthPageSize = useStore(store, selectors.monthPageSize);
  const visibleDate = useStore(store, selectors.visibleDate);

  const targetDate = React.useMemo(
    () => adapter.addMonths(visibleDate, monthPageSize),
    [visibleDate, monthPageSize, adapter],
  );

  const isDisabled = useStore(store, selectors.isSetMonthButtonDisabled, disabled, targetDate);

  const setTarget = useStableCallback(() => {
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

  export interface Props extends BaseUIComponentProps<'button', State>, NativeButtonProps {}
}
