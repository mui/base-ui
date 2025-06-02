import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { TemporalSupportedObject } from '../../models';

export function useSharedCalendarDayCell(parameters: useSharedCalendarDayCell.Parameters) {
  const adapter = useTemporalAdapter();
  const { value, format = adapter.formats.dayOfMonthNoLeadingZeros, ctx } = parameters;

  const formattedValue = React.useMemo(
    () => adapter.formatByString(value, format),
    [adapter, value, format],
  );

  const onClick = useEventCallback(() => {
    if (ctx.isUnavailable) {
      return;
    }
    ctx.selectDate(value);
  });

  const props: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    role: 'gridcell',
    'aria-selected': ctx.isSelected ? true : undefined,
    'aria-current': ctx.isCurrent ? 'date' : undefined,
    'aria-disabled': (ctx.isDisabled ?? ctx.isUnavailable) ? true : undefined,
    children: formattedValue,
    disabled: ctx.isDisabled,
    tabIndex: ctx.isTabbable ? 0 : -1,
    onClick,
  };

  return { props };
}

export namespace useSharedCalendarDayCell {
  export interface PublicParameters {
    /**
     * The value to select when this cell is clicked.
     */
    value: TemporalSupportedObject;
    /**
     * The format used to display the day.
     * @default calendar.formats.dayOfMonth
     */
    format?: string;
  }

  export interface Parameters extends PublicParameters {
    /**
     * The memoized context forwarded by the wrapper component so that this component does not need to subscribe to any context.
     */
    ctx: Context;
  }

  export interface ReturnValue {
    props: React.ButtonHTMLAttributes<HTMLButtonElement>;
  }

  export interface Context {
    isSelected: boolean;
    isDisabled: boolean;
    isUnavailable: boolean;
    isTabbable: boolean;
    isCurrent: boolean;
    isStartOfWeek: boolean;
    isEndOfWeek: boolean;
    isOutsideCurrentMonth: boolean;
    selectDate: (date: TemporalSupportedObject) => void;
  }
}
