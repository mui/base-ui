'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { TemporalSupportedObject } from '../../models';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

const CalendarDayGridHeaderCell = React.forwardRef(function CalendarDayGridHeaderCell(
  componentProps: CalendarDayGridHeaderCell.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const adapter = useTemporalAdapter();
  const defaultFormatter = React.useCallback(
    (date: TemporalSupportedObject) =>
      adapter.format(date, 'weekday3Letters').charAt(0).toUpperCase(),
    [adapter],
  );

  const { className, render, value, formatter = defaultFormatter, ...otherProps } = componentProps;

  const formattedValue = React.useMemo(() => formatter(value), [formatter, value]);
  const ariaLabel = React.useMemo(() => adapter.format(value, 'weekday'), [adapter, value]);

  const state: CalendarDayGridHeaderCell.State = React.useMemo(() => ({}), []);

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      { role: 'columnheader', 'aria-label': ariaLabel, children: formattedValue },
      otherProps,
    ],
  });

  return element;
});

export namespace CalendarDayGridHeaderCell {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {
    value: TemporalSupportedObject;
    /**
     * The formatter function used to display the day of the week.
     * @param {TemporalSupportedObject} date The date to format.
     * @returns {string} The formatted date.
     * @default (date) => calendar.format(date, 'weekday3Letters').charAt(0).toUpperCase()
     */
    formatter?: (date: TemporalSupportedObject) => string;
  }
}

const MemoizedCalendarDayGridHeaderCell = React.memo(CalendarDayGridHeaderCell);

export { MemoizedCalendarDayGridHeaderCell as CalendarDayGridHeaderCell };
