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
  const baseRootContext = useSharedCalendarRootContext();
  const baseDayGridBodyContext = useSharedCalendarDayGridBodyContext();
  const baseDayGridRowContext = useCalendarDayGridRowContext();
  const ref = React.useRef<HTMLButtonElement>(null);
  const adapter = useTemporalAdapter();
  const mergedRef = useForkRef(forwardedRef, ref);

  const isSelected = React.useMemo(
    () => baseRootContext.selectedDates.some((date) => adapter.isSameDay(date, value)),
    [baseRootContext.selectedDates, value, adapter],
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
    () =>
      baseDayGridBodyContext.month == null
        ? false
        : !adapter.isSameMonth(baseDayGridBodyContext.month, value),
    [baseDayGridBodyContext.month, value, adapter],
  );

  const isDateInvalid = baseRootContext.isDateInvalid;
  const isInvalid = React.useMemo(() => isDateInvalid(value), [value, isDateInvalid]);

  const isDisabled = React.useMemo(() => {
    if (baseRootContext.disabled) {
      return true;
    }

    return isInvalid;
  }, [baseRootContext.disabled, isInvalid]);

  const canCellBeTabbed = baseDayGridBodyContext.canCellBeTabbed;
  const isTabbable = React.useMemo(() => canCellBeTabbed(value), [canCellBeTabbed, value]);

  const selectDay = useEventCallback((date: TemporalSupportedObject) => {
    if (baseRootContext.readOnly) {
      return;
    }

    const newCleanValue = mergeDateAndTime(adapter, date, baseRootContext.currentDate);

    baseRootContext.selectDate(newCleanValue, { section: 'day' });
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

  const registerDayGridCell = baseRootContext.registerDayGridCell;
  useModernLayoutEffect(() => {
    return registerDayGridCell({
      cell: ref,
      row: baseDayGridRowContext.ref,
      grid: baseDayGridBodyContext.ref,
    });
  }, [baseDayGridBodyContext.ref, baseDayGridRowContext.ref, registerDayGridCell]);

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
