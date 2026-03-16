'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import {
  useSharedCalendarDayGridBody,
  UseSharedCalendarDayGridBodyParameters,
} from './useSharedCalendarDayGridBody';
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

export interface CalendarDayGridBodyState {}

export interface CalendarDayGridBodyProps
  extends
    Omit<BaseUIComponentProps<'tbody', CalendarDayGridBodyState>, 'children'>,
    UseSharedCalendarDayGridBodyParameters {}

export namespace CalendarDayGridBody {
  export type State = CalendarDayGridBodyState;
  export type Props = CalendarDayGridBodyProps;
}
