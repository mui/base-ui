'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups all the parts of the calendar's day grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGrid = React.forwardRef(function CalendarDayGrid(
  componentProps: CalendarDayGrid.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ role: 'grid' }, elementProps],
  });

  return element;
});

export namespace CalendarDayGrid {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
