'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { getWeekdays } from '../../utils/temporal/date-helpers';
import { TemporalSupportedObject } from '../../models';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

const CalendarDayGridHeader = React.forwardRef(function CalendarDayGridHeader(
  componentProps: CalendarDayGridHeader.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const adapter = useTemporalAdapter();

  const days = React.useMemo(() => getWeekdays(adapter, adapter.date()), [adapter]);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children({ days });
    }

    return children;
  }, [children, days]);

  const props = React.useMemo(
    () => ({
      role: 'row',
      children: resolvedChildren,
    }),
    [resolvedChildren],
  );

  const state = React.useMemo(() => ({}), []);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [props, elementProps],
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
