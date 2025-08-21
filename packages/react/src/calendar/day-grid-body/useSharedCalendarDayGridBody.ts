import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../models';
import { useWeekList } from '../../use-week-list';
import { selectors } from '../store';
import { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { findNonDisabledListIndex, isListIndexDisabled } from '../../floating-ui-react/utils';
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  VERTICAL_KEYS,
} from '../../composite/composite';

const BACKWARD_KEYS = new Set([ARROW_UP, ARROW_LEFT]);

export function useSharedCalendarDayGridBody(
  parameters: useSharedCalendarDayGridBody.Parameters,
): useSharedCalendarDayGridBody.ReturnValue {
  const { fixedWeekNumber, children, offset = 0 } = parameters;

  const adapter = useTemporalAdapter();
  const { store, registerDayGrid, setVisibleDate } = useSharedCalendarRootContext();
  const visibleDate = useStore(store, selectors.visibleDate);
  const referenceDate = useStore(store, selectors.referenceDate);
  const selectedDates = useStore(store, selectors.selectedDates);
  const ref = React.useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const month = React.useMemo(() => {
    const cleanVisibleDate = adapter.startOfMonth(visibleDate);
    return offset === 0 ? cleanVisibleDate : adapter.addMonths(cleanVisibleDate, offset);
  }, [adapter, visibleDate, offset]);

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
      if (itemMetadata?.index != null && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  }, [itemMap]);

  const handleItemLooping = useEventCallback(
    (
      eventKey: React.KeyboardEvent['key'],
      startingIndex: number,
      elementsRef: React.RefObject<(HTMLDivElement | null)[]>,
      decrement: boolean,
    ) => {
      const isHorizontal = eventKey === ARROW_LEFT || eventKey === ARROW_RIGHT;
      let newHighlightedIndex = startingIndex;
      if (eventKey === ARROW_LEFT) {
        // Guess the last cell in the last week
        newHighlightedIndex = weeks.length * 7 - 1;
      } else if (eventKey === ARROW_RIGHT) {
        newHighlightedIndex = 0;
      } else if (eventKey === ARROW_DOWN) {
        // Guess the same weekday in the first week of next month
        newHighlightedIndex %= 7;
      } else if (eventKey === ARROW_UP) {
        // Guess the same weekday in the last week of the previous month
        newHighlightedIndex = weeks.length * 7 - (7 - (startingIndex % 7));
      }
      // Find a non disabled index if the new initially guessed index is disabled
      if (isListIndexDisabled(elementsRef, newHighlightedIndex, disabledIndices)) {
        newHighlightedIndex = findNonDisabledListIndex(elementsRef, {
          startingIndex: newHighlightedIndex,
          decrement,
          disabledIndices,
          amount: isHorizontal ? 1 : 7,
        });
      }
      if (newHighlightedIndex > -1) {
        setHighlightedIndex(newHighlightedIndex);
        const newHighlightedElement = elementsRef.current[newHighlightedIndex];
        if (newHighlightedElement) {
          newHighlightedElement.focus();
        }
      }
    },
  );

  const compositeRootProps: CompositeRoot.Props<useSharedCalendarDayGridBody.ItemMetadata, any> = {
    cols: 7,
    disabledIndices,
    orientation: 'horizontal',
    enableHomeAndEndKeys: true,
    onMapChange: setItemMap,
    highlightedIndex,
    onHighlightedIndexChange: setHighlightedIndex,
    onLoop: (event, prevIndex, nextIndex, elementsRef) => {
      event.preventDefault();
      if (VERTICAL_KEYS.has(event.key)) {
        const newWeekDay = elementsRef.current[prevIndex - (event.key === ARROW_UP ? 7 : -7)];
        if (newWeekDay && newWeekDay.dataset.disabled !== undefined) {
          return prevIndex;
        }
      }
      const decrement = BACKWARD_KEYS.has(event.key);
      setVisibleDate(adapter.addMonths(visibleDate, decrement ? -1 : 1), false);
      queueMicrotask(() => {
        handleItemLooping(event.key, prevIndex, elementsRef, decrement);
      });
      // Return existing index to avoid `composite` handling this highlight update
      return prevIndex;
    },
  };

  const props: HTMLProps = {
    children: resolvedChildren,
  };

  const context: SharedCalendarDayGridBodyContext = React.useMemo(
    () => ({ month, canCellBeTabbed }),
    [month, canCellBeTabbed],
  );

  return { props, compositeRootProps, context, ref };
}

export namespace useSharedCalendarDayGridBody {
  export interface Parameters {
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
    compositeRootProps: CompositeRoot.Props<ItemMetadata, any>;
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
