'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { useSharedCalendarDayGridBody } from './useSharedCalendarDayGridBody';
import { CompositeList } from '../../composite/list/CompositeList';

/**
 * Groups all rows of the calendar's day grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridBody = React.forwardRef(function CalendarDayGrid(
  componentProps: CalendarDayGridBody.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    render,
    children,
    fixedWeekNumber,
    focusOnMount,
    offset,
    freezeMonth,
    ...elementProps
  } = componentProps;

  const { props, rowsRefs, context, ref } = useSharedCalendarDayGridBody({
    children,
    fixedWeekNumber,
    focusOnMount,
    offset,
    freezeMonth,
  });

  const state = React.useMemo(() => ({}), []);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [props, elementProps],
  });

  return (
    <SharedCalendarDayGridBodyContext.Provider value={context}>
      <CompositeList elementsRef={rowsRefs}>{element}</CompositeList>
    </SharedCalendarDayGridBodyContext.Provider>
  );
});

export namespace CalendarDayGridBody {
  export interface State {}

  export interface Props
    extends Omit<BaseUIComponentProps<'div', State>, 'children'>,
      useSharedCalendarDayGridBody.Parameters {}
}
