'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../models';
import { useDayList } from '../../use-day-list';

/**
 * Groups all cells of a given calendar's day grid row.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridRow = React.forwardRef(function CalendarDayGridRow(
  componentProps: CalendarDayGridRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value, children, ...elementProps } = componentProps;

  const getDayList = useDayList();
  const days = React.useMemo(() => getDayList({ date: value, amount: 7 }), [getDayList, value]);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return days.map(children);
    }

    return children;
  }, [children, days]);

  // TODO: Make row index dynamic
  const rowIndex = 1;

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      { role: 'row', 'aria-rowindex': rowIndex + 1, children: resolvedChildren },
      elementProps,
    ],
  });

  return element;
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
