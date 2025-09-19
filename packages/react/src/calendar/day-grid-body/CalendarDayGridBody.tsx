'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { useSharedCalendarDayGridBody } from './useSharedCalendarDayGridBody';
import { CompositeRoot } from '../../composite/root/CompositeRoot';

/**
 * Groups all parts of the calendar's day grid.
 * Renders a `<tbody>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridBody = React.forwardRef(function CalendarDayGridBody(
  componentProps: CalendarDayGridBody.Props,
  forwardedRef: React.ForwardedRef<HTMLTableSectionElement>,
) {
  const { className, render, children, fixedWeekNumber, offset, ...elementProps } = componentProps;

  const { props, compositeRootProps, context, ref } = useSharedCalendarDayGridBody({
    children,
    fixedWeekNumber,
    offset,
  });

  const element = useRenderElement('tbody', componentProps, {
    ref: [forwardedRef, ref],
    props: [props, elementProps],
  });

  return (
    <SharedCalendarDayGridBodyContext.Provider value={context}>
      <CompositeRoot {...compositeRootProps} render={element} />
    </SharedCalendarDayGridBodyContext.Provider>
  );
});

export namespace CalendarDayGridBody {
  export interface State {}

  export interface Props
    extends Omit<BaseUIComponentProps<'tbody', State>, 'children'>,
      useSharedCalendarDayGridBody.Parameters {}
}
