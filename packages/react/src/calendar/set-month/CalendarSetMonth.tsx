'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useStore } from '@base-ui-components/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
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

  const { store, setVisibleDate } = useSharedCalendarRootContext();
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

  const state: CalendarSetMonth.State = React.useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [
      { onClick: setTarget, tabIndex: 0, 'aria-label': adapter.format(target, 'fullMonthAndYear') },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace CalendarSetMonth {
  export interface State {
    /**
     * Whether the button is disabled.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * The month to navigate to.
     */
    target: TemporalSupportedObject;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
