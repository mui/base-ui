'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../types/temporal';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

const InnerCalendarDayGridHeaderCell = React.forwardRef(function InnerCalendarDayGridHeaderCell(
  componentProps: CalendarDayGridHeaderCell.Props,
  forwardedRef: React.ForwardedRef<HTMLTableCellElement>,
) {
  const adapter = useTemporalAdapter();
  const defaultFormatter = React.useCallback(
    (date: TemporalSupportedObject) =>
      adapter.format(date, 'weekday3Letters').charAt(0).toUpperCase(),
    [adapter],
  );

  const { className, render, value, formatter = defaultFormatter, ...otherProps } = componentProps;

  const formattedValue = React.useMemo(() => formatter(value), [formatter, value]);

  const element = useRenderElement('th', componentProps, {
    ref: forwardedRef,
    props: [{ children: formattedValue }, otherProps],
  });

  return element;
});

/**
 * An individual day header cell in the calendar.
 * Renders a `<th>` element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export const CalendarDayGridHeaderCell = React.memo(InnerCalendarDayGridHeaderCell);

export interface CalendarDayGridHeaderCellState {}

export interface CalendarDayGridHeaderCellProps extends BaseUIComponentProps<
  'th',
  CalendarDayGridHeaderCellState
> {
  value: TemporalSupportedObject;
  /**
   * The formatter function used to display the day of the week.
   * @param {TemporalSupportedObject} date The date to format.
   * @returns {string} The formatted date.
   * @default (date) => adapter.format(date, 'EEE').charAt(0).toUpperCase()
   */
  formatter?: ((date: TemporalSupportedObject) => string) | undefined;
}

export namespace CalendarDayGridHeaderCell {
  export type State = CalendarDayGridHeaderCellState;
  export type Props = CalendarDayGridHeaderCellProps;
}
