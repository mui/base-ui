'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSharedCalendarDayGridCell } from './useSharedCalendarDayGridCell';
import { SharedCalendarDayGridCellContext } from './SharedCalendarDayGridCellContext';

const InnerCalendarDayGridCell = React.forwardRef(function InnerCalendarDayGridCell(
  componentProps: CalendarDayGridCell.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value, ...elementProps } = componentProps;
  const { props, context } = useSharedCalendarDayGridCell({ value });

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef],
    props: [props, elementProps],
  });

  return (
    <SharedCalendarDayGridCellContext.Provider value={context}>
      {element}
    </SharedCalendarDayGridCellContext.Provider>
  );
});

/**
 * An individual day cell in the calendar.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridCell = React.memo(InnerCalendarDayGridCell);

export namespace CalendarDayGridCell {
  export interface State {}

  export interface Props
    extends BaseUIComponentProps<'div', State>,
      useSharedCalendarDayGridCell.Parameters {}
}
