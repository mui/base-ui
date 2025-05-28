import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { HTMLProps } from '../../utils/types';
import { TemporalSupportedObject } from '../../models';

export function useSharedCalendarDayCell(parameters: useSharedCalendarDayCell.Parameters) {
  const adapter = useTemporalAdapter();
  const { value, format = adapter.formats.dayOfMonth, ctx } = parameters;

  const formattedValue = React.useMemo(
    () => adapter.formatByString(value, format),
    [adapter, value, format],
  );

  const onClick = useEventCallback(() => {
    ctx.selectDay(value);
  });

  const props = React.useMemo<HTMLProps>(
    () => ({
      role: 'gridcell',
      'aria-selected': ctx.isSelected,
      'aria-current': ctx.isCurrent ? 'date' : undefined,
      'aria-colindex': adapter.getDayOfWeek(value),
      children: formattedValue,
      disabled: ctx.isDisabled,
      tabIndex: ctx.isTabbable ? 0 : -1,
      onClick,
    }),
    [
      adapter,
      value,
      formattedValue,
      ctx.isSelected,
      ctx.isDisabled,
      ctx.isTabbable,
      ctx.isCurrent,
      onClick,
    ],
  );

  return React.useMemo(() => ({ props }), [props]);
}

export namespace useSharedCalendarDayCell {
  export interface PublicParameters {
    /**
     * The value to select when this cell is clicked.
     */
    value: TemporalSupportedObject;
    /**
     * The format used to display the day.
     * @default utils.formats.dayOfMonth
     */
    format?: string;
  }

  export interface Parameters extends PublicParameters {
    /**
     * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
     */
    ctx: Context;
  }

  export interface Context {
    isSelected: boolean;
    isDisabled: boolean;
    isInvalid: boolean;
    isTabbable: boolean;
    isCurrent: boolean;
    isStartOfWeek: boolean;
    isEndOfWeek: boolean;
    isOutsideCurrentMonth: boolean;
    selectDay: (date: TemporalSupportedObject) => void;
  }
}
