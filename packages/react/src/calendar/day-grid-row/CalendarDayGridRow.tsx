'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../models';
import { unstable_useDayList as useDayList } from '../../use-day-list';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';

/**
 * Groups all cells of a given calendar's day grid row.
 * Renders a `<tr>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridRow = React.forwardRef(function CalendarDayGridRow(
  componentProps: CalendarDayGridRow.Props,
  forwardedRef: React.ForwardedRef<HTMLTableRowElement>,
) {
  const { className, render, value, children, ...elementProps } = componentProps;

  const getDayList = useDayList();
  const { registerCurrentMonthDayGrid } = useSharedCalendarRootContext();
  const days = React.useMemo(() => getDayList({ date: value, amount: 7 }), [getDayList, value]);

  React.useEffect(() => {
    const unregister = registerCurrentMonthDayGrid(value, days);
    return () => {
      unregister();
    };
  }, [registerCurrentMonthDayGrid, days, value]);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return days.map(children);
    }

    return children;
  }, [children, days]);

  const element = useRenderElement('tr', componentProps, {
    ref: forwardedRef,
    props: [{ children: resolvedChildren }, elementProps],
  });

  return element;
});

export namespace CalendarDayGridRow {
  export interface State {}

  export interface Props extends Omit<BaseUIComponentProps<'tr', State>, 'children'> {
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
