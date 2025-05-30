import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import type { useSharedCalendarDayCell } from './useSharedCalendarDayCell';
import { useCalendarDayGridRowContext } from '../day-grid-row/CalendarDayGridRowContext';
import { useSharedCalendarDayGridBodyContext } from '../day-grid-body/SharedCalendarDayGridBodyContext';
import { mergeDateAndTime } from '../../utils/temporal/date-helpers';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { TemporalSupportedObject } from '../../models';

export function useSharedCalendarDayCellWrapper(
  parameters: useSharedCalendarDayCellWrapper.Parameters,
): useSharedCalendarDayCellWrapper.ReturnValue {
  const { forwardedRef, value } = parameters;
  const {
    selectedDates,
    isDateInvalid,
    activeDate,
    selectDate,
    registerDayGridCell,
    disabled: isCalendarDisabled,
    readOnly: isCalendarReadOnly,
  } = useSharedCalendarRootContext();
  const { month, canCellBeTabbed, ref: gridBodyRef } = useSharedCalendarDayGridBodyContext();
  const { ref: gridRowRef } = useCalendarDayGridRowContext();
  const ref = React.useRef<HTMLButtonElement>(null);
  const adapter = useTemporalAdapter();
  const mergedRef = useForkRef(forwardedRef, ref);

  const isSelected = React.useMemo(
    () => selectedDates.some((date) => adapter.isSameDay(date, value)),
    [selectedDates, value, adapter],
  );

  const isCurrent = React.useMemo(() => adapter.isSameDay(value, adapter.date()), [adapter, value]);

  const isStartOfWeek = React.useMemo(
    () => adapter.isSameDay(value, adapter.startOfWeek(value)),
    [adapter, value],
  );

  const isEndOfWeek = React.useMemo(
    () => adapter.isSameDay(value, adapter.endOfWeek(value)),
    [adapter, value],
  );

  const isOutsideCurrentMonth = React.useMemo(
    () => (month == null ? false : !adapter.isSameMonth(month, value)),
    [month, value, adapter],
  );

  const isInvalid = React.useMemo(() => isDateInvalid(value), [value, isDateInvalid]);

  const isDisabled = React.useMemo(() => {
    if (isCalendarDisabled) {
      return true;
    }

    return isInvalid;
  }, [isCalendarDisabled, isInvalid]);

  const isTabbable = React.useMemo(() => canCellBeTabbed(value), [canCellBeTabbed, value]);

  const selectDay = useEventCallback((date: TemporalSupportedObject) => {
    if (isCalendarReadOnly) {
      return;
    }

    const newCleanValue = mergeDateAndTime(adapter, date, activeDate);
    selectDate(newCleanValue);
  });

  const ctx = React.useMemo<useSharedCalendarDayCell.Context>(
    () => ({
      isSelected,
      isDisabled,
      isInvalid,
      isTabbable,
      isCurrent,
      isStartOfWeek,
      isEndOfWeek,
      isOutsideCurrentMonth,
      selectDay,
    }),
    [
      isSelected,
      isDisabled,
      isInvalid,
      isTabbable,
      isStartOfWeek,
      isEndOfWeek,
      isCurrent,
      isOutsideCurrentMonth,
      selectDay,
    ],
  );

  useModernLayoutEffect(() => {
    return registerDayGridCell({
      cell: ref,
      row: gridRowRef,
      grid: gridBodyRef,
    });
  }, [gridBodyRef, gridRowRef, registerDayGridCell]);

  return {
    ref: mergedRef,
    ctx,
  };
}

export namespace useSharedCalendarDayCellWrapper {
  export interface Parameters extends Pick<useSharedCalendarDayCell.Parameters, 'value'> {
    /**
     * The ref forwarded by the parent component.
     */
    forwardedRef: React.ForwardedRef<HTMLButtonElement>;
  }

  export interface ReturnValue {
    /**
     * The ref to forward to the component.
     */
    ref: React.RefCallback<HTMLButtonElement> | null;
    /**
     * The memoized context to forward to the memoized component so that it does not need to subscribe to any context.
     */
    ctx: useSharedCalendarDayCell.Context;
  }
}
