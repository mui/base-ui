'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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
import { activeElement } from '../../floating-ui-react/utils/shadowDom';

const BACKWARD_KEYS = new Set([ARROW_UP, ARROW_LEFT]);
const CUSTOM_NAVIGATION_KEYS = new Set([HOME, END, PAGE_UP, PAGE_DOWN]);
const FOCUS_SETTLE_FRAME_COUNT = 2;

export function useSharedCalendarDayGridBody(
  parameters: UseSharedCalendarDayGridBodyParameters,
): UseSharedCalendarDayGridBodyReturnValue {
  const { fixedWeekNumber, children, offset = 0 } = parameters;

  const adapter = useTemporalAdapter();
  const store = useSharedCalendarRootContext();
  const visibleMonth = useStore(store, selectors.visibleMonth);
  const timezone = useStore(store, selectors.timezoneToRender);
  const ref = React.useRef<HTMLTableSectionElement>(null);

  const nowValue = adapter.now(timezone);
  const todayRef = React.useRef(nowValue);
  if (!adapter.isSameDay(todayRef.current, nowValue)) {
    todayRef.current = nowValue;
  }
  const today = todayRef.current;

  const month = React.useMemo(() => {
    return offset === 0 ? visibleMonth : adapter.addMonths(visibleMonth, offset);
  }, [adapter, visibleMonth, offset]);

  const [highlightedIndex, setHighlightedIndex] = React.useState(() => {
    const pendingFocusRequest = store.context.pendingDayGridFocusRequest;
    if (
      pendingFocusRequest &&
      pendingFocusRequest.offset === offset &&
      adapter.isSameMonth(pendingFocusRequest.renderedMonth, month)
    ) {
      return pendingFocusRequest.guessedIndex;
    }

    return 0;
  });
  const clearPendingFocusRequestTimeout = useTimeout();
  const fulfillPendingFocusRequestFrame = useAnimationFrame();
  const pendingVerticalArrowScrollGuardRef = React.useRef<{
    cleanup: () => void;
    id: symbol;
  } | null>(null);

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

  const findNonDisabledItem = (
    elements: Array<HTMLElement | null>,
    itemDisabledIndices: number[],
    guessedIndex: number,
    decrement: boolean,
    amount: number,
  ) => {
    if (elements.length === 0) {
      return null;
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
      return { index: idx, item: elements[idx] };
    }

    return null;
  };

  const focusNonDisabledItem = (
    elements: Array<HTMLElement | null>,
    itemDisabledIndices: number[],
    guessedIndex: number,
    decrement: boolean,
    amount: number,
  ) => {
    const targetItem = findNonDisabledItem(
      elements,
      itemDisabledIndices,
      guessedIndex,
      decrement,
      amount,
    );

    if (targetItem) {
      setHighlightedIndex(targetItem.index);
      targetItem.item?.focus();
    }

    return targetItem?.item ?? null;
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

  const getNavigationItemsFromMap = useStableCallback((newMap: typeof itemMap) => {
    const newItems = Array.from(newMap.keys()) as HTMLElement[];
    const newDisabledIndices: number[] = [];

    for (const meta of newMap.values()) {
      if (meta?.index != null && !meta.focusable) {
        newDisabledIndices.push(meta.index);
      }
    }

    return { newItems, newDisabledIndices };
  });

  const cleanupPendingVerticalArrowScrollGuard = useStableCallback((requestId?: symbol) => {
    const currentGuard = pendingVerticalArrowScrollGuardRef.current;

    if (!currentGuard || (requestId != null && currentGuard.id !== requestId)) {
      return;
    }

    currentGuard.cleanup();
    pendingVerticalArrowScrollGuardRef.current = null;
  });

  const installPendingVerticalArrowScrollGuard = useStableCallback(
    (body: HTMLTableSectionElement, requestId: symbol) => {
      if (pendingVerticalArrowScrollGuardRef.current?.id === requestId) {
        return;
      }

      cleanupPendingVerticalArrowScrollGuard();

      const doc = ownerDocument(body);
      const preventVerticalArrowScroll = (event: KeyboardEvent) => {
        if (store.context.pendingDayGridFocusRequest?.id !== requestId) {
          return;
        }

        if (event.key === ARROW_UP || event.key === ARROW_DOWN) {
          event.preventDefault();
        }
      };

      doc.addEventListener('keydown', preventVerticalArrowScroll, true);
      pendingVerticalArrowScrollGuardRef.current = {
        cleanup: () => {
          doc.removeEventListener('keydown', preventVerticalArrowScroll, true);
        },
        id: requestId,
      };
    },
  );

  // Focuses the correct item after a cross-month navigation (PageUp/PageDown or arrow-key
  // loop). Uses the new month's item map directly because the `disabledIndices` state
  // variable still reflects the old month at this point.
  const getItemFromMap = useStableCallback(
    (newMap: typeof itemMap, guessedIndex: number, decrement: boolean, amount: number) => {
      const { newItems, newDisabledIndices } = getNavigationItemsFromMap(newMap);
      return focusNonDisabledItem(newItems, newDisabledIndices, guessedIndex, decrement, amount);
    },
  );

  const setPendingFocusRequest = (
    visibleMonthToFocus: TemporalSupportedObject,
    renderedMonthToFocus: TemporalSupportedObject,
    guessedIndex: number,
    decrement: boolean,
    amount: number,
  ) => {
    const requestId = Symbol();

    cleanupPendingVerticalArrowScrollGuard();

    store.context.pendingDayGridFocusRequest = {
      amount,
      decrement,
      guessedIndex,
      id: requestId,
      offset,
      renderedMonth: renderedMonthToFocus,
      visibleMonthToFocus,
      sourceItemMap: itemMap,
    };
    clearPendingFocusRequestTimeout.start(0, () => {
      if (
        store.context.pendingDayGridFocusRequest?.id === requestId &&
        !adapter.isSameMonth(store.state.visibleDate, visibleMonthToFocus)
      ) {
        cleanupPendingVerticalArrowScrollGuard(requestId);
        store.context.pendingDayGridFocusRequest = undefined;
      }
    });
  };

  useIsoLayoutEffect(() => {
    const pendingFocusRequest = store.context.pendingDayGridFocusRequest;
    if (
      pendingFocusRequest &&
      pendingFocusRequest.offset === offset &&
      adapter.isSameMonth(pendingFocusRequest.renderedMonth, month) &&
      pendingFocusRequest.sourceItemMap !== itemMap &&
      itemMap.size > 0
    ) {
      const requestId = pendingFocusRequest.id;
      let settledFrameCount = 0;
      const clearPendingFocusRequest = () => {
        cleanupPendingVerticalArrowScrollGuard(requestId);

        if (store.context.pendingDayGridFocusRequest?.id === requestId) {
          store.context.pendingDayGridFocusRequest = undefined;
        }
      };

      const attemptFocus = () => {
        if (store.context.pendingDayGridFocusRequest?.id !== requestId) {
          cleanupPendingVerticalArrowScrollGuard(requestId);
          return;
        }

        const currentBody = ref.current;
        if (!currentBody) {
          fulfillPendingFocusRequestFrame.request(attemptFocus);
          return;
        }

        installPendingVerticalArrowScrollGuard(currentBody, requestId);

        const doc = ownerDocument(currentBody);
        const win = ownerWindow(currentBody);
        const activeItem = activeElement(doc);
        const { newItems, newDisabledIndices } = getNavigationItemsFromMap(itemMap);
        const targetItem = findNonDisabledItem(
          newItems,
          newDisabledIndices,
          pendingFocusRequest.guessedIndex,
          pendingFocusRequest.decrement,
          pendingFocusRequest.amount,
        );

        if (activeElement(doc) !== targetItem?.item) {
          getItemFromMap(
            itemMap,
            pendingFocusRequest.guessedIndex,
            pendingFocusRequest.decrement,
            pendingFocusRequest.amount,
          );
        }

        const focusIsOnTargetItem = activeElement(doc) === targetItem?.item;
        const mountedDayGridBodyCount =
          currentBody.parentElement == null
            ? 1
            : Array.from(currentBody.parentElement.children).filter(
                (child) => child.nodeName === 'TBODY',
              ).length;
        const shouldYieldToNewNavigation =
          activeItem instanceof win.HTMLElement &&
          currentBody.contains(activeItem) &&
          activeItem !== targetItem?.item &&
          activeItem.tabIndex === 0;

        if (mountedDayGridBodyCount > 1 && shouldYieldToNewNavigation) {
          clearPendingFocusRequest();
          return;
        }

        if (!focusIsOnTargetItem) {
          settledFrameCount = 0;
          fulfillPendingFocusRequestFrame.request(attemptFocus);
          return;
        }

        if (mountedDayGridBodyCount > 1) {
          settledFrameCount = 0;
          fulfillPendingFocusRequestFrame.request(attemptFocus);
          return;
        }

        settledFrameCount += 1;
        if (settledFrameCount < FOCUS_SETTLE_FRAME_COUNT) {
          fulfillPendingFocusRequestFrame.request(attemptFocus);
          return;
        }

        clearPendingFocusRequest();
      };

      if (ref.current) {
        installPendingVerticalArrowScrollGuard(ref.current, requestId);
      }

      fulfillPendingFocusRequestFrame.request(attemptFocus);

      return () => {
        cleanupPendingVerticalArrowScrollGuard(requestId);
      };
    }

    return undefined;
  }, [
    adapter,
    cleanupPendingVerticalArrowScrollGuard,
    fulfillPendingFocusRequestFrame,
    getItemFromMap,
    getNavigationItemsFromMap,
    installPendingVerticalArrowScrollGuard,
    itemMap,
    month,
    offset,
    store,
  ]);

  const clearPendingFocusRequestForInterruptedNavigation = () => {
    const pendingFocusRequest = store.context.pendingDayGridFocusRequest;

    if (
      pendingFocusRequest &&
      pendingFocusRequest.offset === offset &&
      pendingFocusRequest.sourceItemMap !== itemMap &&
      adapter.isSameMonth(pendingFocusRequest.renderedMonth, month)
    ) {
      cleanupPendingVerticalArrowScrollGuard(pendingFocusRequest.id);
      store.context.pendingDayGridFocusRequest = undefined;
    }
  };

  const handleKeyboardNavigation = (event: BaseUIEvent<React.KeyboardEvent>) => {
    const eventKey = event.key;
    clearPendingFocusRequestForInterruptedNavigation();

    if (eventKey === ARROW_UP || eventKey === ARROW_DOWN) {
      event.preventDefault();
    }

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
        const newMonth = adapter.addMonths(month, decrement ? -amount : amount);
        const newGridDays = computeMonthDayGrid(adapter, newMonth, fixedWeekNumber);

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
            // If the month has some valid days, navigate and let the new month's focus resolution
            // land on the nearest valid day.
            if (
              (maxDate != null && adapter.isAfter(adapter.startOfMonth(targetMonth), maxDate)) ||
              (minDate != null && adapter.isBefore(adapter.endOfMonth(targetMonth), minDate))
            ) {
              return;
            }
          }
        }

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

        setPendingFocusRequest(targetMonth, newMonth, sameDayInNewMonthIndex, searchDecrement, 1);

        const eventDetails = store.setVisibleDateAndGetDetails(
          targetMonth,
          event.nativeEvent,
          event.currentTarget as HTMLElement,
          REASONS.keyboard,
        );
        if (eventDetails.isCanceled) {
          cleanupPendingVerticalArrowScrollGuard();
          store.context.pendingDayGridFocusRequest = undefined;
        }

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
    const newMonth = adapter.addMonths(month, decrement ? -1 : 1);
    const newGridDays = computeMonthDayGrid(adapter, newMonth, fixedWeekNumber);

    let guessedIndex: number;
    if (eventKey === ARROW_LEFT) {
      guessedIndex = newGridDays.length - 1;
    } else if (eventKey === ARROW_RIGHT) {
      guessedIndex = 0;
    } else if (eventKey === ARROW_DOWN) {
      guessedIndex = prevIndex % 7;
    } else {
      // ARROW_UP: same weekday in the last row of the previous month
      guessedIndex = newGridDays.length - 7 + (prevIndex % 7);
    }

    setPendingFocusRequest(
      targetMonth,
      newMonth,
      guessedIndex,
      decrement,
      HORIZONTAL_KEYS.has(eventKey) ? 1 : 7,
    );

    const eventDetails = store.setVisibleDateAndGetDetails(
      targetMonth,
      event.nativeEvent,
      event.currentTarget as HTMLElement,
      REASONS.keyboard,
    );
    if (eventDetails.isCanceled) {
      cleanupPendingVerticalArrowScrollGuard();
      store.context.pendingDayGridFocusRequest = undefined;
    }

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
