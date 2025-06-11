import * as React from 'react';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { useScrollableList } from '../utils/useScrollableList';
import { HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../models';
import { useWeekList } from '../../use-week-list';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeRoot } from '../../composite/root/CompositeRoot';

export function useSharedCalendarDayGridBody(
  parameters: useSharedCalendarDayGridBody.Parameters,
): useSharedCalendarDayGridBody.ReturnValue {
  const { fixedWeekNumber, focusOnMount, children, offset = 0, freezeMonth = false } = parameters;

  const adapter = useTemporalAdapter();
  const { store, registerDayGrid } = useSharedCalendarRootContext();
  const visibleDate = useSelector(store, selectors.visibleDate);
  const referenceDate = useSelector(store, selectors.referenceDate);
  const selectedDates = useSelector(store, selectors.selectedDates);
  const ref = React.useRef<HTMLDivElement>(null);

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

  const getWeekList = useWeekList();
  const weeks = React.useMemo(
    () => getWeekList({ date: month, amount: fixedWeekNumber ?? 'end-of-month' }),
    [getWeekList, month, fixedWeekNumber],
  );

  const canCellBeTabbed = React.useMemo(() => {
    let tabbableCells: TemporalSupportedObject[];

    const selectedAndVisibleDays = selectedDates.filter((selectedDate) =>
      adapter.isSameMonth(selectedDate, month),
    );

    // If some selected dates are in the current month, we use them as tabbable cells
    if (selectedAndVisibleDays.length > 0) {
      tabbableCells = selectedAndVisibleDays;
    }
    // If the current date in this month is selected, we use it as the tabbable cell.
    else if (adapter.isSameMonth(referenceDate, month)) {
      tabbableCells = [referenceDate];
    }
    // Otherwise, we use the first day of the month as the tabbable cell.
    else {
      tabbableCells = [month];
    }

    const format = `${adapter.formats.yearPadded}/${adapter.formats.monthPadded}/${adapter.formats.dayOfMonth}`;
    const formattedTabbableCells = new Set(
      tabbableCells.map((day) => adapter.formatByString(day, format)),
    );

    return (date: TemporalSupportedObject) =>
      formattedTabbableCells.has(adapter.formatByString(date, format));
  }, [adapter, referenceDate, selectedDates, month]);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return weeks.map(children);
    }

    return children;
  }, [children, weeks]);

  const [itemMap, setItemMap] = React.useState(
    () => new Map<Node, CompositeMetadata<useSharedCalendarDayGridBody.ItemMetadata> | null>(),
  );

  const disabledIndices = React.useMemo(() => {
    const output: number[] = [];
    for (const itemMetadata of itemMap.values()) {
      if (itemMetadata?.index && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  }, [itemMap]);

  const compositeRootProps: CompositeRoot.Props<useSharedCalendarDayGridBody.ItemMetadata> = {
    cols: 7,
    disabledIndices,
    enableHomeAndEndKeys: true,
    onMapChange: setItemMap,
  };

  const props: HTMLProps = {
    role: 'rowgroup',
    children: resolvedChildren,
  };

  const context: SharedCalendarDayGridBodyContext = React.useMemo(
    () => ({ month, canCellBeTabbed }),
    [month, canCellBeTabbed],
  );

  return { props, compositeRootProps, context, ref };
}

export namespace useSharedCalendarDayGridBody {
  export interface Parameters extends useScrollableList.PublicParameters {
    /**
     * The children of the component.
     * If a function is provided, it will be called for each week to render as its parameter.
     */
    children?:
      | React.ReactNode
      | ((
          week: TemporalSupportedObject,
          index: number,
          weeks: TemporalSupportedObject[],
        ) => React.ReactNode);
    /**
     * Will render the requested amount of weeks by adding weeks of the next month if needed.
     * Put it to 6 to create a Gregorian calendar where all months have the same amount of weeks displayed.
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

  export interface ItemMetadata {
    focusableWhenDisabled?: boolean;
  }

  export interface ChildrenParameters {
    weeks: TemporalSupportedObject[];
  }

  export interface ReturnValue {
    /**
     * The props to apply to the element.
     */
    props: HTMLProps;
    /**
     * The props to apply to the composite root.
     */
    compositeRootProps: CompositeRoot.Props<ItemMetadata>;
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
