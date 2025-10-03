'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups all parts of the calendar's day grid header.
 * Renders a `<thead>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridHeader = React.forwardRef(function CalendarDayGridHeader(
  componentProps: CalendarDayGridHeader.Props,
  forwardedRef: React.ForwardedRef<HTMLTableSectionElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const element = useRenderElement('thead', componentProps, {
    ref: forwardedRef,
    props: [{ 'aria-hidden': true }, elementProps],
  });

  return element;
});

export namespace CalendarDayGridHeader {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'thead', State> {}
}
