'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { BaseUIEvent, HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../types/temporal';
import { useCalendarWeekList } from '../use-week-list/useCalendarWeekList';
import { selectors } from '../store';
import { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { findNonDisabledListIndex, isListIndexDisabled } from '../../floating-ui-react/utils';
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  HORIZONTAL_KEYS,
  VERTICAL_KEYS,
  HOME,
  END,
  PAGE_UP,
  PAGE_DOWN,
} from '../../composite/composite';

const BACKWARD_KEYS = new Set([ARROW_UP, ARROW_LEFT]);
const CUSTOM_NAVIGATION_KEYS = new Set([HOME, END, PAGE_UP, PAGE_DOWN]);

export function useSharedCalendarDayGridBody(
  parameters: UseSharedCalendarDayGridBodyParameters,
): UseSharedCalendarDayGridBodyReturnValue {
  const { fixedWeekNumber, children, offset = 0 } = parameters;

  const adapter = useTemporalAdapter();
  const store = useSharedCalendarRootContext();
  const visibleMonth = useStore(store, selectors.visibleMonth);
  const ref = React.useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const executeAfterItemMapUpdate = React.useRef<(newMap: any) => void>(null);

  const month = React.useMemo(() => {
    return offset === 0 ? visibleMonth : adapter.addMonths(visibleMonth, offset);
  }, [adapter, visibleMonth, offset]);

  React.useEffect(() => store.registerDayGrid(month), [store, month]);

  const getWeekList = useCalendarWeekList();
  const weeks = React.useMemo(
    () => getWeekList({ date: month, amount: fixedWeekNumber ?? 'end-of-month' }),
    [getWeekList, month, fixedWeekNumber],
  );

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return weeks.map(children);
    }

    return children;
  }, [children, weeks]);

  const [itemMap, setItemMap] = React.useState(
    () => new Map<Node, CompositeMetadata<UseSharedCalendarDayGridBodyItemMetadata> | null>(),
  );

  const items = React.useMemo(() => Array.from(itemMap.keys()) as HTMLElement[], [itemMap]);

  const disabledIndices = React.useMemo(() => {
    const output: number[] = [];
    for (const itemMetadata of itemMap.values()) {
      if (itemMetadata?.index != null && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  }, [itemMap]);

  const handleItemMapUpdate = (newMap: typeof itemMap) => {
    setItemMap(newMap);
    if (executeAfterItemMapUpdate.current) {
      queueMicrotask(() => {
        executeAfterItemMapUpdate.current?.(newMap);
        executeAfterItemMapUpdate.current = null;
      });
    }
  };

  const focusNextNonDisabledElement = ({
    elements = items,
    newHighlightedIndex,
    decrement,
    amount,
  }: {
    elements?: Array<HTMLElement | null> | undefined;
    newHighlightedIndex: number;
    decrement: boolean;
    amount: number;
  }) => {
    // Find a non disabled index if the new initially guessed index is disabled
    if (isListIndexDisabled(elements, newHighlightedIndex, disabledIndices)) {
      newHighlightedIndex = findNonDisabledListIndex(elements, {
        startingIndex: newHighlightedIndex,
        decrement,
        disabledIndices,
        amount,
      });
    }
    if (newHighlightedIndex > -1) {
      setHighlightedIndex(newHighlightedIndex);
      const newHighlightedElement = elements[newHighlightedIndex];
      if (newHighlightedElement) {
        newHighlightedElement.focus();
      }
    }
  };

  const handleKeyboardNavigation = (event: BaseUIEvent<React.KeyboardEvent>) => {
    const eventKey = event.key;
    if (!CUSTOM_NAVIGATION_KEYS.has(eventKey)) {
      return;
    }
    switch (eventKey) {
      case HOME:
      case END: {
        // allow for default composite navigation in case we are on the first or last day of the week
        if ((highlightedIndex + 1) % 7 === (eventKey === HOME ? 1 : 0)) {
          return;
        }
        // prevent default composite navigation and handle it ourselves
        event.preventDefault();
        event.preventBaseUIHandler();
        const currentWeekStartIndex = Math.floor(highlightedIndex / 7) * 7;
        const newHighlightedIndex =
          eventKey === HOME ? currentWeekStartIndex : currentWeekStartIndex + 6;
        focusNextNonDisabledElement({
          elements: items,
          newHighlightedIndex,
          decrement: eventKey === HOME,
          amount: 1,
        });
        break;
      }

      case PAGE_UP:
      case PAGE_DOWN: {
        event.preventDefault();
        // Without knowing the current day we can not move to next month and focus the same day
        const decrement = eventKey === PAGE_UP;
        let amount = 1;
        if (event.shiftKey) {
          amount = 12;
        }
        const gridDays = Object.values(store.getCurrentMonthDayGrid())
          .flat() // Sort the days to ensure they are in the chronological order
          .sort((a, b) => adapter.getTime(a) - adapter.getTime(b));
        const currentDay = gridDays[highlightedIndex];
        if (!currentDay) {
          return;
        }
        const dayOfMonth = adapter.getDate(currentDay);
        const currentMonth = adapter.getMonth(currentDay);
        const currentYear = adapter.getYear(currentDay);
        store.setVisibleDate(
          adapter.addMonths(visibleMonth, decrement ? -amount : amount),
          event.nativeEvent,
          event.currentTarget as HTMLElement,
          'keyboard',
        );
        executeAfterItemMapUpdate.current = (newMap: typeof itemMap) => {
          const newGridDays: TemporalSupportedObject[] = Object.values(store.getCurrentMonthDayGrid)
            .flat()
            // Sort the days to ensure they are in the chronological order
            .sort((a, b) => adapter.getTime(a) - adapter.getTime(b));
          // Try to find the same day in the new month
          const sameDayInNewMonthIndex = newGridDays.findIndex(
            (day) =>
              adapter.getDate(day) === dayOfMonth &&
              (adapter.getMonth(day) !== currentMonth || adapter.getYear(day) !== currentYear),
          );
          const newItems = Array.from(newMap.keys()) as HTMLElement[];
          focusNextNonDisabledElement({
            elements: newItems,
            newHighlightedIndex: sameDayInNewMonthIndex,
            decrement: eventKey === PAGE_UP,
            amount: 1,
          });
        };

        break;
      }
      default: {
        break;
      }
    }
  };

  const handleItemLooping = (
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

    focusNextNonDisabledElement({
      elements: elementsRef.current,
      newHighlightedIndex,
      decrement,
      amount: isHorizontal ? 1 : 7,
    });
  };

  const compositeRootProps: CompositeRoot.Props<UseSharedCalendarDayGridBodyItemMetadata, any> = {
    cols: 7,
    disabledIndices,
    orientation: 'horizontal',
    enableHomeAndEndKeys: true,
    onMapChange: handleItemMapUpdate,
    highlightedIndex,
    onKeyDown: handleKeyboardNavigation,
    onHighlightedIndexChange: setHighlightedIndex,
    onLoop: (event, prevIndex, nextIndex, elementsRef) => {
      event.preventDefault();
      const eventKey = event.key;
      if (VERTICAL_KEYS.has(eventKey)) {
        const newWeekDay = elementsRef.current[prevIndex - (eventKey === ARROW_UP ? 7 : -7)];
        if (newWeekDay && newWeekDay.dataset.disabled !== undefined) {
          return prevIndex;
        }
      } else if (HORIZONTAL_KEYS.has(eventKey)) {
        const newDay = elementsRef.current[prevIndex + (eventKey === ARROW_LEFT ? -1 : 1)];
        if (newDay && newDay.dataset.disabled !== undefined) {
          return prevIndex;
        }
      }
      const decrement = BACKWARD_KEYS.has(eventKey);
      store.setVisibleDate(
        adapter.addMonths(visibleMonth, decrement ? -1 : 1),
        event.nativeEvent,
        event.currentTarget as HTMLElement,
        'keyboard',
      );
      // Ensure the `handleItemLooping` uses the latest state/render after the visible date update
      queueMicrotask(() => {
        handleItemLooping(eventKey, prevIndex, elementsRef, decrement);
      });
      // Return existing index to avoid `composite` handling this highlight update
      return prevIndex;
    },
  };

  const props: HTMLProps = {
    children: resolvedChildren,
  };

  const context: SharedCalendarDayGridBodyContext = React.useMemo(() => ({ month }), [month]);

  return { props, compositeRootProps, context, ref };
}

export interface UseSharedCalendarDayGridBodyParameters {
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
   * Set it to 6 to create a Gregorian calendar where all months have the same number of weeks.
   */
  fixedWeekNumber?: number | undefined;
  /**
   * The offset to apply to the rendered month compared to the current month.
   * This is mostly useful when displaying multiple day grids.
   * @default 0
   */
  offset?: number | undefined;
}

export interface UseSharedCalendarDayGridBodyItemMetadata {
  focusableWhenDisabled?: boolean | undefined;
}

export interface UseSharedCalendarDayGridBodyReturnValue {
  /**
   * The props to apply to the element.
   */
  props: HTMLProps;
  /**
   * The props to apply to the composite root.
   */
  compositeRootProps: CompositeRoot.Props<UseSharedCalendarDayGridBodyItemMetadata, any>;
  /**
   * The context to provide to the children of the component.
   */
  context: SharedCalendarDayGridBodyContext;
  /**
   * The ref to apply to the element.
   */
  ref: React.RefObject<HTMLDivElement | null>;
}
