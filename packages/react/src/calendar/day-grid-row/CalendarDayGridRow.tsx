'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../models';
import { useDayList } from '../../use-day-list';

const InnerCalendarDayGridRow = React.forwardRef(function InnerCalendarDayGridRow(
  componentProps: InnerCalendarDayGridRowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value, ctx, children, ...elementProps } = componentProps;

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return ctx.days.map(children);
    }

    return children;
  }, [children, ctx.days]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      { role: 'row', 'aria-rowindex': ctx.rowIndex + 1, children: resolvedChildren },
      elementProps,
    ],
  });

  return element;
});

const MemoizedInnerCalendarDayGridRow = React.memo(InnerCalendarDayGridRow);

/**
 * Groups all cells of a given calendar's day grid row.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridRow = React.forwardRef(function CalendarDayGridRow(
  props: CalendarDayGridRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const getDayList = useDayList();
  const days = React.useMemo(
    () => getDayList({ date: props.value, amount: 7 }),
    [getDayList, props.value],
  );

  const ctx = React.useMemo<InnerCalendarDayGridRowContext>(
    () => ({ days, rowIndex: 1 }), // TODO: Fix the row index to be dynamic
    [days],
  );

  return <MemoizedInnerCalendarDayGridRow {...props} ref={forwardedRef} ctx={ctx} />;
});

export namespace CalendarDayGridRow {
  export interface State {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'children'> {
    /**
     * The date object representing the week.
     */
    value: TemporalSupportedObject;
    /**
     * The children of the component.
     * If a function is provided, it will be called for each day of the week as its parameter.
     */
    children?:
      | React.ReactNode
      | ((
          day: TemporalSupportedObject,
          index: number,
          days: TemporalSupportedObject[],
        ) => React.ReactNode);
  }

  export interface ChildrenParameters {
    /**
     * The days of the week.
     */
    days: TemporalSupportedObject[];
  }
}

interface InnerCalendarDayGridRowProps extends CalendarDayGridRow.Props {
  /**
   * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
   */
  ctx: InnerCalendarDayGridRowContext;
}

interface InnerCalendarDayGridRowContext {
  /**
   * The days to render in the row.
   */
  days: TemporalSupportedObject[];
  /**
   * The index of the row in the grid.
   */
  rowIndex: number;
}
