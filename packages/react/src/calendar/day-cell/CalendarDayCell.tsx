'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CalendarDayCellDataAttributes } from './CalendarDayCellDataAttributes';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSharedCalendarDayCell } from './useSharedCalendarDayCell';
import { useSharedCalendarDayCellWrapper } from './useSharedCalendarDayCellWrapper';

const customStyleHookMapping: CustomStyleHookMapping<CalendarDayCell.State> = {
  selected(value) {
    return value ? { [CalendarDayCellDataAttributes.selected]: '' } : null;
  },
  disabled(value) {
    return value ? { [CalendarDayCellDataAttributes.disabled]: '' } : null;
  },
  invalid(value) {
    return value ? { [CalendarDayCellDataAttributes.invalid]: '' } : null;
  },
  current(value) {
    return value ? { [CalendarDayCellDataAttributes.current]: '' } : null;
  },
  startOfWeek(value) {
    return value ? { [CalendarDayCellDataAttributes.startOfWeek]: '' } : null;
  },
  endOfWeek(value) {
    return value ? { [CalendarDayCellDataAttributes.endOfWeek]: '' } : null;
  },
  outsideMonth(value) {
    return value ? { [CalendarDayCellDataAttributes.outsideMonth]: '' } : null;
  },
};

const InnerCalendarDayCell = React.forwardRef(function InnerCalendarDayCell(
  componentProps: InnerCalendarDayCellProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, value, ctx, ...elementProps } = componentProps;
  const { props } = useSharedCalendarDayCell({ value, ctx });

  const state: CalendarDayCell.State = React.useMemo(
    () => ({
      selected: ctx.isSelected,
      disabled: ctx.isDisabled,
      unavailable: ctx.isUnavailable,
      current: ctx.isCurrent,
      startOfWeek: ctx.isStartOfWeek,
      endOfWeek: ctx.isEndOfWeek,
      outsideMonth: ctx.isOutsideCurrentMonth,
    }),
    [
      ctx.isSelected,
      ctx.isDisabled,
      ctx.isUnavailable,
      ctx.isCurrent,
      ctx.isStartOfWeek,
      ctx.isEndOfWeek,
      ctx.isOutsideCurrentMonth,
    ],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
    customStyleHookMapping,
  });

  return element;
});

const MemoizedInnerCalendarDayCell = React.memo(InnerCalendarDayCell);

const CalendarDayCell = React.forwardRef(function CalendarDayCell(
  props: CalendarDayCell.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { ref, ctx } = useSharedCalendarDayCellWrapper({ value: props.value, forwardedRef });

  return <MemoizedInnerCalendarDayCell ref={ref} {...props} ctx={ctx} />;
});

export namespace CalendarDayCell {
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
     * Whether the day is the first day of its week.
     */
    startOfWeek: boolean;
    /**
     * Whether the day is the last day of its week.
     */
    endOfWeek: boolean;
    /**
     * Whether the day is outside the month rendered by the day grid wrapping it.
     */
    outsideMonth: boolean;
  }

  export interface Props
    extends Omit<BaseUIComponentProps<'button', State>, 'value'>,
      useSharedCalendarDayCell.PublicParameters {}
}

interface InnerCalendarDayCellProps extends CalendarDayCell.Props {
  /**
   * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
   */
  ctx: InnerCalendarDayCellContext;
}

interface InnerCalendarDayCellContext extends useSharedCalendarDayCell.Context {}

export { CalendarDayCell };
