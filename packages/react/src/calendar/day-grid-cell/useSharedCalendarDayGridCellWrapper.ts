import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import type { useSharedCalendarDayGridCell } from './useSharedCalendarDayGridCell';

export function useSharedCalendarDayGridCellWrapper(
  parameters: useSharedCalendarDayGridCellWrapper.Parameters,
): useSharedCalendarDayGridCellWrapper.ReturnValue {
  const { value } = parameters;
  const {
    getDateValidationError,
    isDateUnavailable,
    disabled: isCalendarDisabled,
  } = useSharedCalendarRootContext();

  const validationError = React.useMemo(
    () => getDateValidationError(value),
    [getDateValidationError, value],
  );

  const isDisabled = isCalendarDisabled || validationError != null;

  const isUnavailable = React.useMemo(
    () => isDateUnavailable?.(value) ?? false,
    [isDateUnavailable, value],
  );

  const ctx = React.useMemo<useSharedCalendarDayGridCell.Context>(
    () => ({
      isDisabled,
      isUnavailable,
    }),
    [isDisabled, isUnavailable],
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
