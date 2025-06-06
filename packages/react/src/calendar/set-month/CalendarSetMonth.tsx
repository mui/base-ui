'use client';
import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useSharedCalendarRootVisibleDateContext } from '../root/SharedCalendarRootVisibleDateContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useEventCallback } from '../../utils/useEventCallback';
import { TemporalSupportedObject } from '../../models';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

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

  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const {
    disabled: isCalendarDisabled,
    validationProps: dateValidationProps,
    setVisibleDate,
  } = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();

  const targetDate = React.useMemo(
    () =>
      adapter.setYear(
        adapter.setMonth(visibleDate, adapter.getMonth(target)),
        adapter.getYear(target),
      ),
    [visibleDate, adapter, target],
  );

  const isDisabled = React.useMemo(() => {
    if (isCalendarDisabled || disabled) {
      return true;
    }

    // The target month and all the months before are fully disabled, we disable the button.
    if (
      dateValidationProps.minDate != null &&
      adapter.isBefore(adapter.endOfMonth(targetDate), dateValidationProps.minDate)
    ) {
      return true;
    }

    // The target month and all the months after are fully disabled, we disable the button.
    return (
      dateValidationProps.maxDate != null &&
      adapter.isAfter(adapter.startOfMonth(targetDate), dateValidationProps.maxDate)
    );
  }, [
    isCalendarDisabled,
    disabled,
    dateValidationProps.minDate,
    dateValidationProps.maxDate,
    targetDate,
    adapter,
  ]);

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
