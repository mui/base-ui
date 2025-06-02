'use client';
import * as React from 'react';
import { useForkRef } from '../../utils/useForkRef';
import { CalendarDayGridRowContext } from './CalendarDayGridRowContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { TemporalSupportedObject } from '../../models';
import { useDayList } from '../../use-day-list';

const InnerCalendarDayGridRow = React.forwardRef(function InnerCalendarDayGridRow(
  componentProps: InnerCalendarDayGridRowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value, ctx, children, ...elementProps } = componentProps;

  const ref = React.useRef<HTMLDivElement>(null);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children({ days: ctx.days });
    }

    return children;
  }, [children, ctx.days]);

  const context: CalendarDayGridRowContext = React.useMemo(() => ({ ref }), [ref]);

  const state = React.useMemo(() => ({}), []);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ ref, role: 'row', children: resolvedChildren }, elementProps],
  });

  return (
    <CalendarDayGridRowContext.Provider value={context}>
      {element}
    </CalendarDayGridRowContext.Provider>
  );
});

const MemoizedInnerCalendarDayGridRow = React.memo(InnerCalendarDayGridRow);

const CalendarDayGridRow = React.forwardRef(function CalendarDayGridRow(
  props: CalendarDayGridRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { ref: listItemRef, index } = useCompositeListItem();
  const ref = useForkRef(forwardedRef, listItemRef);

  const getDayList = useDayList();
  const days = React.useMemo(
    () => getDayList({ date: props.value, amount: 7 }),
    [getDayList, props.value],
  );

  const ctx = React.useMemo<InnerCalendarDayGridRowContext>(
    () => ({
      days,
      rowIndex: index,
    }),
    [days, index],
  );

  return <MemoizedInnerCalendarDayGridRow {...props} ref={ref} ctx={ctx} />;
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
     * If a function is provided, it will be called with the days to render as its parameter.
     */
    children?: React.ReactNode | ((parameters: ChildrenParameters) => React.ReactNode);
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

export { CalendarDayGridRow };
