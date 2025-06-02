'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../models';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useDayList } from '../../use-day-list';

const CalendarDayGridHeader = React.forwardRef(function CalendarDayGridHeader(
  componentProps: CalendarDayGridHeader.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
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
      return children({ days });
    }

    return children;
  }, [children, days]);

  const state = React.useMemo(() => ({}), []);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ role: 'row', children: resolvedChildren }, elementProps],
  });

  return element;
});

export namespace CalendarDayGridHeader {
  export interface State {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'children'> {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the days of the week as its parameter.
     */
    children?: React.ReactNode | ((parameters: ChildrenParameters) => React.ReactNode);
  }

  export interface ChildrenParameters {
    days: TemporalSupportedObject[];
  }
}

export { CalendarDayGridHeader };
