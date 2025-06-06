import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import type { useSharedCalendarDayGridCell } from './useSharedCalendarDayGridCell';
import { validateDate } from '../../utils/temporal/date-helpers';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useSharedCalendarDayGridBodyContext } from '../day-grid-body/SharedCalendarDayGridBodyContext';

export function useSharedCalendarDayGridCellWrapper(
  parameters: useSharedCalendarDayGridCellWrapper.Parameters,
): useSharedCalendarDayGridCellWrapper.ReturnValue {
  const { value } = parameters;

  const adapter = useTemporalAdapter();
  const {
    validationProps,
    isDateUnavailable,
    disabled: isCalendarDisabled,
  } = useSharedCalendarRootContext();
  const { month } = useSharedCalendarDayGridBodyContext();

  const validationError = React.useMemo(
    () => validateDate({ adapter, value, validationProps }),
    [adapter, value, validationProps],
  );

  const isDisabled = isCalendarDisabled || validationError != null;

  const isUnavailable = React.useMemo(
    () => isDateUnavailable?.(value) ?? false,
    [isDateUnavailable, value],
  );

  const isOutsideCurrentMonth = React.useMemo(
    () => (month == null ? false : !adapter.isSameMonth(month, value)),
    [month, value, adapter],
  );

  const ctx: useSharedCalendarDayGridCell.Context = React.useMemo(
    () => ({
      isDisabled,
      isUnavailable,
      isOutsideCurrentMonth,
    }),
    [isDisabled, isUnavailable, isOutsideCurrentMonth],
  );

  return {
    ctx,
  };
}

export namespace useSharedCalendarDayGridCellWrapper {
  export interface Parameters extends Pick<useSharedCalendarDayGridCell.Parameters, 'value'> {}

  export interface ReturnValue {
    /**
     * The memoized context to forward to the memoized component so that it does not need to subscribe to any context.
     */
    ctx: useSharedCalendarDayGridCell.Context;
  }
}
