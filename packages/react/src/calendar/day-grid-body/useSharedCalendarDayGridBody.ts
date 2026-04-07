'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { REASONS } from '../../utils/reasons';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { SharedCalendarDayGridBodyContext } from './SharedCalendarDayGridBodyContext';
import { BaseUIEvent, HTMLProps } from '../../utils/types';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../types/temporal';
import { useCalendarWeekList } from '../use-week-list/useCalendarWeekList';
import { selectors } from '../store';
import { computeMonthDayGrid } from '../utils/computeMonthDayGrid';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { findNonDisabledListIndex, isListIndexDisabled } from '../../floating-ui-react/utils';
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  HORIZONTAL_KEYS,
  HOME,
  END,
  PAGE_UP,
  PAGE_DOWN,
} from '../../composite/composite';
import { validateDate } from '../../utils/temporal/validateDate';

const BACKWARD_KEYS = new Set([ARROW_UP, ARROW_LEFT]);
const CUSTOM_NAVIGATION_KEYS = new Set([HOME, END, PAGE_UP, PAGE_DOWN]);

export function useSharedCalendarDayGridBody(
  parameters: UseSharedCalendarDayGridBodyParameters,
): UseSharedCalendarDayGridBodyReturnValue {
  const { fixedWeekNumber, children, offset = 0 } = parameters;

  const adapter = useTemporalAdapter();
  const store = useSharedCalendarRootContext();
  const visibleMonth = useStore(store, selectors.visibleMonth);
  const timezone = useStore(store, selectors.timezoneToRender);
  const ref = React.useRef<HTMLTableSectionElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const executeAfterItemMapUpdate = React.useRef<(newMap: any) => void>(null);

  const nowValue = adapter.now(timezone);
  const todayRef = React.useRef(nowValue);
  if (!adapter.isSameDay(todayRef.current, nowValue)) {
    todayRef.current = nowValue;
  }
  const today = todayRef.current;

  const month = React.useMemo(() => {
    return offset === 0 ? visibleMonth : adapter.addMonths(visibleMonth, offset);
  }, [adapter, visibleMonth, offset]);

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

  const prevDisabledIndicesRef = React.useRef<number[]>([]);

  const disabledIndices = React.useMemo(() => {
    const output: number[] = [];
    for (const itemMetadata of itemMap.values()) {
      if (itemMetadata?.index != null && !itemMetadata.focusable) {
        output.push(itemMetadata.index);
      }
    }
    if (areArraysEqual(prevDisabledIndicesRef.current, output)) {
      return prevDisabledIndicesRef.current;
    }
    prevDisabledIndicesRef.current = output;
    return output;
  }, [itemMap]);

  const handleItemMapUpdate = (newMap: typeof itemMap) => {
    setItemMap(newMap);
  };

  // Execute pending focus callback after React has committed the new item map to the DOM.
  // This replaces a queueMicrotask approach that could fire before React's commit phase.
  useIsoLayoutEffect(() => {
    if (executeAfterItemMapUpdate.current) {
      executeAfterItemMapUpdate.current(itemMap);
      executeAfterItemMapUpdate.current = null;
    }
  }, [itemMap]);

  const focusNonDisabledItem = (
    elements: Array<HTMLElement | null>,
    itemDisabledIndices: number[],
    guessedIndex: number,
    decrement: boolean,
    amount: number,
  ) => {
    if (elements.length === 0) {
      return;
    }
    let idx = guessedIndex;
    if (isListIndexDisabled(elements, idx, itemDisabledIndices)) {
      idx = findNonDisabledListIndex(elements, {
        startingIndex: idx,
        decrement,
        disabledIndices: itemDisabledIndices,
        amount,
      });
    }
    if (idx >= 0 && idx < elements.length) {
      setHighlightedIndex(idx);
      elements[idx]?.focus();
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
    focusNonDisabledItem(elements, disabledIndices, newHighlightedIndex, decrement, amount);
  };

  // Focuses the correct item after a cross-month navigation (PageUp/PageDown or arrow-key
  // loop). Uses the new month's item map directly because the `disabledIndices` state
  // variable still reflects the old month at this point.
  const focusItemFromMap = (
    newMap: typeof itemMap,
    guessedIndex: number,
    decrement: boolean,
    amount: number,
  ) => {
    const newItems = Array.from(newMap.keys()) as HTMLElement[];
    const newDisabledIndices: number[] = [];
    for (const meta of newMap.values()) {
      if (meta?.index != null && !meta.focusable) {
        newDisabledIndices.push(meta.index);
      }
    }
    focusNonDisabledItem(newItems, newDisabledIndices, guessedIndex, decrement, amount);
  };

  const handleKeyboardNavigation = (event: BaseUIEvent<React.KeyboardEvent>) => {
    const eventKey = event.key;

    if (!CUSTOM_NAVIGATION_KEYS.has(eventKey)) {
      return;
    }
    switch (eventKey) {
      case HOME:
      case END: {
        const colIndex = highlightedIndex % 7;
        // allow for default composite navigation in case we are on the first or last day of the week
        if ((eventKey === HOME && colIndex === 0) || (eventKey === END && colIndex === 6)) {
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
          decrement: eventKey === END,
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
        const currentDay = computeMonthDayGrid(adapter, month, fixedWeekNumber, weeks)[
          highlightedIndex
        ];
        if (!currentDay) {
          return;
        }

        const targetDate = adapter.addMonths(currentDay, decrement ? -amount : amount);
        const targetMonth = adapter.addMonths(visibleMonth, decrement ? -amount : amount);

        const { minDate, maxDate } = store.state;
        // Check if the target date would be within min/max bounds
        let dateValidationError: ReturnType<typeof validateDate> = null;
        if (minDate != null || maxDate != null) {
          dateValidationError = validateDate({
            adapter,
            value: targetDate,
            validationProps: { minDate, maxDate },
          });
          if (dateValidationError != null) {
            // Block navigation only if the entire target month is outside the valid range.
            // If the month has some valid days, navigate and let focusItemFromMap find the nearest one.
            if (
              (maxDate != null && adapter.isAfter(adapter.startOfMonth(targetMonth), maxDate)) ||
              (minDate != null && adapter.isBefore(adapter.endOfMonth(targetMonth), minDate))
            ) {
              return;
            }
          }
        }

        store.setVisibleDate(
          targetMonth,
          event.nativeEvent,
          event.currentTarget as HTMLElement,
          REASONS.keyboard,
        );
        executeAfterItemMapUpdate.current = (newMap: typeof itemMap) => {
          const newMonth = adapter.addMonths(month, decrement ? -amount : amount);
          const newGridDays = computeMonthDayGrid(adapter, newMonth, fixedWeekNumber);
          // Find the target date in the new month's grid. Use targetDate (already clamped
          // by addMonths) so that e.g. Jan 31 + 1 month correctly finds Feb 28.
          const targetDayOfMonth = adapter.getDate(targetDate);
          const targetMonthValue = adapter.getMonth(targetDate);
          const targetYearValue = adapter.getYear(targetDate);
          const sameDayInNewMonthIndex = newGridDays.findIndex(
            (day) =>
              adapter.getDate(day) === targetDayOfMonth &&
              adapter.getMonth(day) === targetMonthValue &&
              adapter.getYear(day) === targetYearValue,
          );
          // When the target day is disabled, find the nearest valid day in the right direction:
          // beyond maxDate → search backward for the last valid day;
          // before minDate → search forward for the first valid day.
          let searchDecrement = eventKey === PAGE_UP;
          if (dateValidationError === 'after-max-date') {
            searchDecrement = true;
          } else if (dateValidationError === 'before-min-date') {
            searchDecrement = false;
          }
          focusItemFromMap(newMap, sameDayInNewMonthIndex, searchDecrement, 1);
        };

        break;
      }
      default: {
        break;
      }
    }
  };

  const handleLooping: CompositeRoot.Props<
    UseSharedCalendarDayGridBodyItemMetadata,
    any
  >['onLoop'] = (event, prevIndex) => {
    event.preventDefault();
    const eventKey = event.key;
    const decrement = BACKWARD_KEYS.has(eventKey);

    const targetMonth = adapter.addMonths(visibleMonth, decrement ? -1 : 1);

    const { minDate, maxDate } = store.state;
    if (minDate != null || maxDate != null) {
      // Check if the target month has any valid (non-disabled) days within min/max bounds.
      if (
        (minDate != null && adapter.isBefore(adapter.endOfMonth(targetMonth), minDate)) ||
        (maxDate != null && adapter.isAfter(adapter.startOfMonth(targetMonth), maxDate))
      ) {
        // The entire target month is outside the valid range; stay put.
        return prevIndex;
      }
    }

    // Change the visible month and focus the equivalent day once the new month's
    // DOM has been committed. This covers every arrow-key loop scenario, including
    // cases where an outside-month day is visible as the first/last row of the
    // current grid — the visible date must always update when crossing a month boundary.
    store.setVisibleDate(
      targetMonth,
      event.nativeEvent,
      event.currentTarget as HTMLElement,
      REASONS.keyboard,
    );

    executeAfterItemMapUpdate.current = (newMap: typeof itemMap) => {
      const newItems = Array.from(newMap.keys()) as HTMLElement[];

      let guessedIndex: number;
      if (eventKey === ARROW_LEFT) {
        guessedIndex = newItems.length - 1;
      } else if (eventKey === ARROW_RIGHT) {
        guessedIndex = 0;
      } else if (eventKey === ARROW_DOWN) {
        guessedIndex = prevIndex % 7;
      } else {
        // ARROW_UP: same weekday in the last row of the previous month
        guessedIndex = newItems.length - 7 + (prevIndex % 7);
      }

      focusItemFromMap(newMap, guessedIndex, decrement, HORIZONTAL_KEYS.has(eventKey) ? 1 : 7);
    };

    // Return the current index so the composite does not move focus before the new month renders.
    return prevIndex;
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
    onLoop: handleLooping,
  };

  const props: HTMLProps = {
    children: resolvedChildren,
  };

  const context: SharedCalendarDayGridBodyContext = React.useMemo(
    () => ({ month, today }),
    [month, today],
  );

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
  focusable?: boolean | undefined;
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
  ref: React.RefObject<HTMLTableSectionElement | null>;
}
