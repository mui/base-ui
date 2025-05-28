import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { useSharedCalendarRootVisibleDateContext } from '../root/SharedCalendarRootVisibleDateContext';
import { useScrollableList } from '../utils/useScrollableList';
import { HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../models';

export function useSharedCalendarDayGridBody(
  parameters: useSharedCalendarDayGridBody.Parameters,
): useSharedCalendarDayGridBody.ReturnValue {
  const { fixedWeekNumber, focusOnMount, children, offset = 0, freezeMonth = false } = parameters;
  const adapter = useTemporalAdapter();
  const { selectedDates, currentDate, registerDayGrid, applyDayGridKeyboardNavigation } =
    useSharedCalendarRootContext();
  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const ref = React.useRef<HTMLDivElement>(null);
  const rowsRefs = React.useRef<(HTMLElement | null)[]>([]);

  const rawMonth = React.useMemo(() => {
    const cleanVisibleDate = adapter.startOfMonth(visibleDate);
    return offset === 0 ? cleanVisibleDate : adapter.addMonths(cleanVisibleDate, offset);
  }, [adapter, visibleDate, offset]);

  const lastNonFrozenMonthRef = React.useRef(rawMonth);
  React.useEffect(() => {
    if (!freezeMonth) {
      lastNonFrozenMonthRef.current = rawMonth;
    }
  }, [freezeMonth, rawMonth]);

  const month = freezeMonth ? lastNonFrozenMonthRef.current : rawMonth;

  useScrollableList({ focusOnMount, ref });

  React.useEffect(() => {
    return registerDayGrid(month);
  }, [registerDayGrid, month]);

  const daysGrid = React.useMemo(() => {
    const toDisplay = adapter.getWeekArray(month);
    let nextMonth = adapter.addMonths(month, 1);
    while (fixedWeekNumber && toDisplay.length < fixedWeekNumber) {
      const additionalWeeks = adapter.getWeekArray(nextMonth);
      const hasCommonWeek = adapter.isSameDay(
        toDisplay[toDisplay.length - 1][0],
        additionalWeeks[0][0],
      );

      additionalWeeks.slice(hasCommonWeek ? 1 : 0).forEach((week) => {
        if (toDisplay.length < fixedWeekNumber) {
          toDisplay.push(week);
        }
      });

      nextMonth = adapter.addMonths(nextMonth, 1);
    }

    return toDisplay;
  }, [month, fixedWeekNumber, adapter]);

  const canCellBeTabbed = React.useMemo(() => {
    let tabbableCells: TemporalSupportedObject[];
    const daysInMonth = daysGrid.flat().filter((day) => adapter.isSameMonth(day, month));
    const selectedAndVisibleDays = daysInMonth.filter((day) =>
      selectedDates.some((selectedDay) => adapter.isSameDay(day, selectedDay)),
    );
    if (selectedAndVisibleDays.length > 0) {
      tabbableCells = selectedAndVisibleDays;
    } else {
      const currentDay = daysInMonth.find((day) => adapter.isSameDay(day, currentDate));
      if (currentDay != null) {
        tabbableCells = [currentDay];
      } else {
        tabbableCells = daysInMonth.slice(0, 1);
      }
    }

    const format = `${adapter.formats.year}/${adapter.formats.month}/${adapter.formats.dayOfMonth}`;
    const formattedTabbableCells = new Set(
      tabbableCells.map((day) => adapter.formatByString(day, format)),
    );

    return (date: TemporalSupportedObject) =>
      formattedTabbableCells.has(adapter.formatByString(date, format));
  }, [currentDate, selectedDates, daysGrid, adapter, month]);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children({ weeks: daysGrid.map((week) => week[0]) });
    }

    return children;
  }, [children, daysGrid]);

  const props = React.useMemo(
    () => ({
      ref,
      role: 'rowgroup',
      children: resolvedChildren,
      onKeyDown: applyDayGridKeyboardNavigation,
    }),
    [applyDayGridKeyboardNavigation, resolvedChildren],
  );

  const context: SharedCalendarDayGridBodyContext = React.useMemo(
    () => ({ daysGrid, month, canCellBeTabbed, ref }),
    [daysGrid, month, canCellBeTabbed, ref],
  );

  return React.useMemo(() => ({ props, rowsRefs, context, ref }), [props, rowsRefs, context, ref]);
}

export namespace useSharedCalendarDayGridBody {
  export interface Parameters extends useScrollableList.PublicParameters {
    /**
     * The children of the component.
     * If a function is provided, it will be called with the weeks weeks to render as its parameter.
     */
    children?: React.ReactNode | ((parameters: ChildrenParameters) => React.ReactNode);
    /**
     * The day view will show as many weeks as needed after the end of the current month to match this value.
     * Put it to 6 to have a fixed number of weeks in Gregorian calendars
     */
    fixedWeekNumber?: number;
    /**
     * The offset to apply to the rendered month compared to the current month.
     * This is mostly useful when displaying multiple day grids.
     * @default 0
     */
    offset?: number;
    /**
     * If `true`, the component's month won't update when the visible date or the offset changes.
     * This is mostly useful when doing transitions between several months to avoid having the exiting month updated to the new visible date.
     */
    freezeMonth?: boolean;
  }

  export interface ChildrenParameters {
    weeks: TemporalSupportedObject[];
  }

  export interface ReturnValue {
    /**
     * The props to apply to the element.
     */
    props: HTMLProps;
    // TODO: Use Composite instead.
    /**
     * The ref of each row rendered inside the component.
     */
    rowsRefs: React.RefObject<(HTMLElement | null)[]>;
    /**
     * The context to provide to the children of the component.
     */
    context: SharedCalendarDayGridBodyContext;
    /**
     * The ref to apply to the element.
     */
    ref: React.RefObject<HTMLDivElement | null>;
  }
}
