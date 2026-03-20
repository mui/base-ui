'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  useSharedCalendarDayGridCell,
  UseSharedCalendarDayGridCellParameters,
} from './useSharedCalendarDayGridCell';
import { SharedCalendarDayGridCellContext } from './SharedCalendarDayGridCellContext';

const InnerCalendarDayGridCell = React.forwardRef(function InnerCalendarDayGridCell(
  componentProps: CalendarDayGridCell.Props,
  forwardedRef: React.ForwardedRef<HTMLTableCellElement>,
) {
  const { className, render, value, ...elementProps } = componentProps;
  const { props, context } = useSharedCalendarDayGridCell({ value });

  const element = useRenderElement('td', componentProps, {
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
 * Renders a `<td>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridCell = React.memo(InnerCalendarDayGridCell);

export interface CalendarDayGridCellState {}

export interface CalendarDayGridCellProps
  extends
    BaseUIComponentProps<'td', CalendarDayGridCellState>,
    UseSharedCalendarDayGridCellParameters {}

export namespace CalendarDayGridCell {
  export type State = CalendarDayGridCellState;
  export type Props = CalendarDayGridCellProps;
}
