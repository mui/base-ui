'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CalendarDayButtonDataAttributes } from './CalendarDayButtonDataAttributes';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useButton } from '../../use-button';
import { TemporalSupportedObject } from '../../models';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { useSharedCalendarDayGridBodyContext } from '../day-grid-body/SharedCalendarDayGridBodyContext';
import { useCalendarDayGridRowContext } from '../day-grid-row/CalendarDayGridRowContext';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useForkRef, useModernLayoutEffect } from '../../utils';
import { useCalendarDayGridCellContext } from '../day-grid-cell/SharedCalendarDayGridCellContext';
import { useEventCallback } from '../../utils/useEventCallback';

const customStyleHookMapping: CustomStyleHookMapping<CalendarDayButton.State> = {
  selected(value) {
    return value ? { [CalendarDayButtonDataAttributes.selected]: '' } : null;
  },
  disabled(value) {
    return value ? { [CalendarDayButtonDataAttributes.disabled]: '' } : null;
  },
  unavailable(value) {
    return value ? { [CalendarDayButtonDataAttributes.unavailable]: '' } : null;
  },
  current(value) {
    return value ? { [CalendarDayButtonDataAttributes.current]: '' } : null;
  },
  outsideMonth(value) {
    return value ? { [CalendarDayButtonDataAttributes.outsideMonth]: '' } : null;
  },
};

const InnerCalendarDayButton = React.forwardRef(function InnerCalendarDayButton(
  componentProps: InnerCalendarDayButtonProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const adapter = useTemporalAdapter();

  const {
    className,
    render,
    nativeButton,
    ctx,
    format = adapter.formats.dayOfMonth,
    disabled,
    ...elementProps
  } = componentProps;

  const isDisabled = disabled ?? ctx.isDisabled;

  const { getButtonProps, buttonRef } = useButton({
    disabled: isDisabled,
    native: nativeButton,
  });

  const formattedValue = React.useMemo(
    () => adapter.formatByString(ctx.value, format),
    [adapter, ctx.value, format],
  );

  const onClick = useEventCallback(() => {
    if (ctx.isUnavailable) {
      return;
    }
    ctx.selectDate(ctx.value);
  });

  const props: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    'aria-label': ctx.formattedDate,
    'aria-selected': ctx.isSelected ? true : undefined,
    'aria-current': ctx.isCurrent ? 'date' : undefined,
    'aria-disabled':
      isDisabled || ctx.isOutsideCurrentMonth || ctx.isUnavailable ? true : undefined,
    children: formattedValue,
    tabIndex: ctx.isTabbable ? 0 : -1,
    onClick,
  };

  const state: CalendarDayButton.State = React.useMemo(
    () => ({
      selected: ctx.isSelected,
      disabled: isDisabled,
      unavailable: ctx.isUnavailable,
      current: ctx.isCurrent,
      outsideMonth: ctx.isOutsideCurrentMonth,
    }),
    [ctx.isSelected, isDisabled, ctx.isUnavailable, ctx.isCurrent, ctx.isOutsideCurrentMonth],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping,
  });

  return element;
});

const MemoizedInnerCalendarDayButton = React.memo(InnerCalendarDayButton);

/**
 * An individual interactive day button in the calendar.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayButton = React.forwardRef(function CalendarDayButton(
  props: CalendarDayButton.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { selectedDates, selectDate, registerDayGridCell } = useSharedCalendarRootContext();
  const { canCellBeTabbed, ref: gridBodyRef } = useSharedCalendarDayGridBodyContext();
  const { ref: gridRowRef } = useCalendarDayGridRowContext();
  const { isDisabled, isUnavailable, isOutsideCurrentMonth, value } =
    useCalendarDayGridCellContext();
  const ref = React.useRef<HTMLButtonElement>(null);
  const adapter = useTemporalAdapter();
  const mergedRef = useForkRef(forwardedRef, ref);

  const isSelected = React.useMemo(
    () => selectedDates.some((date) => adapter.isSameDay(date, value)),
    [selectedDates, value, adapter],
  );

  const isCurrent = React.useMemo(
    () => adapter.isSameDay(value, adapter.now(adapter.getTimezone(value))),
    [adapter, value],
  );

  const isTabbable = React.useMemo(() => canCellBeTabbed(value), [canCellBeTabbed, value]);

  const formattedDate = React.useMemo(
    () => adapter.format(value, 'localizedDateWithFullMonthAndWeekDay'),
    [adapter, value],
  );

  const ctx = React.useMemo<InnerCalendarDayButtonContext>(
    () => ({
      value,
      isSelected,
      isDisabled,
      isUnavailable,
      isTabbable,
      isCurrent,
      isOutsideCurrentMonth,
      selectDate,
      formattedDate,
    }),
    [
      value,
      isSelected,
      isDisabled,
      isUnavailable,
      isTabbable,
      isCurrent,
      isOutsideCurrentMonth,
      selectDate,
      formattedDate,
    ],
  );

  useModernLayoutEffect(() => {
    return registerDayGridCell({
      cell: ref,
      row: gridRowRef,
      grid: gridBodyRef,
    });
  }, [gridBodyRef, gridRowRef, registerDayGridCell]);

  return <MemoizedInnerCalendarDayButton ref={mergedRef} {...props} ctx={ctx} />;
});

export namespace CalendarDayButton {
  export interface State {
    /**
     * Whether the day is selected.
     */
    selected: boolean;
    /**
     * Whether the day is disabled.
     */
    disabled: boolean;
    /**
     * Whether the day is not available.
     */
    unavailable: boolean;
    /**
     * Whether the day contains the current date.
     */
    current: boolean;
    /**
     * Whether the day is outside the month rendered by the day grid wrapping it.
     */
    outsideMonth: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'value'> {
    /**
     * The format used to display the day.
     * @default adapter.formats.dayOfMonth
     */
    format?: string;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}

interface InnerCalendarDayButtonProps extends CalendarDayButton.Props {
  /**
   * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
   */
  ctx: InnerCalendarDayButtonContext;
}

interface InnerCalendarDayButtonContext {
  value: TemporalSupportedObject;
  isSelected: boolean;
  isDisabled: boolean;
  isUnavailable: boolean;
  isTabbable: boolean;
  isCurrent: boolean;
  isOutsideCurrentMonth: boolean;
  selectDate: (date: TemporalSupportedObject) => void;
  formattedDate: string;
}
