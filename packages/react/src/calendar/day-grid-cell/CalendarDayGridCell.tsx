'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSharedCalendarDayGridCell } from './useSharedCalendarDayGridCell';
import { useSharedCalendarDayGridCellWrapper } from './useSharedCalendarDayGridCellWrapper';
import { SharedCalendarDayGridCellContext } from './SharedCalendarDayGridCellContext';

const InnerCalendarDayGridCell = React.forwardRef(function InnerCalendarDayGridCell(
  componentProps: InnerCalendarDayGridCellProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, value, ctx, ...elementProps } = componentProps;
  const { props, context } = useSharedCalendarDayGridCell({ value, ctx });

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

const MemoizedInnerCalendarDayGridCell = React.memo(InnerCalendarDayGridCell);

/**
 * An individual day cell in the calendar.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridCell = React.forwardRef(function CalendarDayGridCell(
  props: CalendarDayGridCell.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { ctx } = useSharedCalendarDayGridCellWrapper({ value: props.value });

  return <MemoizedInnerCalendarDayGridCell ref={forwardedRef} {...props} ctx={ctx} />;
});

export namespace CalendarDayGridCell {
  export interface State {}

  export interface Props
    extends BaseUIComponentProps<'div', State>,
      useSharedCalendarDayGridCell.PublicParameters {}
}

interface InnerCalendarDayGridCellProps extends CalendarDayGridCell.Props {
  /**
   * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
   */
  ctx: InnerCalendarDayGridCellContext;
}

interface InnerCalendarDayGridCellContext extends useSharedCalendarDayGridCell.Context {}
