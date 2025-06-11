'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../models';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useDayList } from '../../use-day-list';

/**
 * Groups all cells of the calendar's day grid header row.
 * Renders a `<tr>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridHeaderRow = React.forwardRef(function CalendarDayGridHeaderRow(
  componentProps: CalendarDayGridHeaderRow.Props,
  forwardedRef: React.ForwardedRef<HTMLTableRowElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const adapter = useTemporalAdapter();

  const getDayList = useDayList();
  const days = React.useMemo(
    () => getDayList({ date: adapter.startOfWeek(adapter.now('default')), amount: 7 }),
    [adapter, getDayList],
  );

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

export namespace CalendarDayGridHeaderRow {
  export interface State {}

  export interface Props extends Omit<BaseUIComponentProps<'tr', State>, 'children'> {
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
}
