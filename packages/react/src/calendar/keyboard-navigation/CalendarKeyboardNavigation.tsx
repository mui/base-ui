'use client';
import * as React from 'react';
import { useTimeout } from '../../utils/useTimeout';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import {
  applyInitialFocusInGrid,
  navigateInGrid,
  NavigateInGridChangePage,
  PageGridNavigationTarget,
} from '../utils/keyboardNavigation';
import { useEventCallback } from '../../utils/useEventCallback';
import { SharedCalendarKeyboardNavigationContext } from './SharedCalendarKeyboardNavigationContext';
import { useSharedCalendarRootVisibleDateContext } from '../root/SharedCalendarRootVisibleDateContext';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';

/**
 * Enables keyboard navigation in the calendar.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export function CalendarKeyboardNavigation(props: CalendarKeyboardNavigation.Props) {
  const { setVisibleDate, monthPageSize, dateValidationProps } = useSharedCalendarRootContext();
  const { visibleDate } = useSharedCalendarRootVisibleDateContext();
  const adapter = useTemporalAdapter();
  const cellsRef = React.useRef(new Map<number, CalendarKeyboardNavigation.CellRefs>());
  const pageNavigationTargetRef = React.useRef<PageGridNavigationTarget | null>(null);

  const timeout = useTimeout();
  React.useEffect(() => {
    if (pageNavigationTargetRef.current) {
      const target = pageNavigationTargetRef.current;
      timeout.start(0, () => {
        const cells = getCellsInCalendar(cellsRef);
        applyInitialFocusInGrid({ cells, target });
      });
    }
  }, [visibleDate, timeout]);

  const applyDayGridKeyboardNavigation = useEventCallback((event: React.KeyboardEvent) => {
    const changePage: NavigateInGridChangePage = (params) => {
      // TODO: Jump over months with no valid date.
      if (params.direction === 'previous') {
        const targetDate = adapter.addMonths(adapter.startOfMonth(visibleDate), -monthPageSize);
        const lastMonthInNewPage = adapter.addMonths(targetDate, monthPageSize - 1);

        // All the months before the visible ones are fully disabled, we skip the navigation.
        if (
          adapter.isAfter(adapter.startOfMonth(dateValidationProps.minDate), lastMonthInNewPage)
        ) {
          return;
        }

        setVisibleDate(adapter.addMonths(visibleDate, -monthPageSize), false);
      }
      if (params.direction === 'next') {
        const targetDate = adapter.addMonths(adapter.startOfMonth(visibleDate), monthPageSize);

        // All the months after the visible ones are fully disabled, we skip the navigation.
        if (adapter.isBefore(adapter.startOfMonth(dateValidationProps.maxDate), targetDate)) {
          return;
        }
        setVisibleDate(adapter.addMonths(visibleDate, monthPageSize), false);
      }

      pageNavigationTargetRef.current = params.target;
    };
    const cells = getCellsInCalendar(cellsRef);
    navigateInGrid({ cells, event, changePage });
  });

  const registerDayGridCell = useEventCallback((refs: CalendarKeyboardNavigation.CellRefs) => {
    const id = Math.random();
    cellsRef.current.set(id, refs);
    return () => cellsRef.current.delete(id);
  });

  const contextValue: SharedCalendarKeyboardNavigationContext = React.useMemo(
    () => ({ registerDayGridCell, applyDayGridKeyboardNavigation }),
    [registerDayGridCell, applyDayGridKeyboardNavigation],
  );

  return (
    <SharedCalendarKeyboardNavigationContext.Provider value={contextValue}>
      {props.children}
    </SharedCalendarKeyboardNavigationContext.Provider>
  );
}

export namespace CalendarKeyboardNavigation {
  export interface Props {
    children: React.ReactNode;
  }

  export interface CellRefs {
    cell: React.RefObject<HTMLButtonElement | null>;
    row: React.RefObject<HTMLDivElement | null>;
    grid: React.RefObject<HTMLElement | null>;
  }
}

/* eslint-disable no-bitwise */
const createSortByDocumentPosition =
  <T extends unknown>(getDOMElement: (element: T) => HTMLElement) =>
  (a: T, b: T) => {
    const aElement = getDOMElement(a);
    const bElement = getDOMElement(b);
    const position = aElement.compareDocumentPosition(bElement);

    if (
      position & Node.DOCUMENT_POSITION_FOLLOWING ||
      position & Node.DOCUMENT_POSITION_CONTAINED_BY
    ) {
      return -1;
    }

    if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
      return 1;
    }

    return 0;
  };
/* eslint-enable no-bitwise */

function getCellsInCalendar(
  cellsRef: React.RefObject<Map<number, CalendarKeyboardNavigation.CellRefs>>,
) {
  const grids: {
    element: HTMLElement;
    rows: { element: HTMLElement; cells: HTMLButtonElement[] }[];
  }[] = [];

  for (const [, cellRefs] of cellsRef.current) {
    if (cellRefs.cell.current && cellRefs.row.current && cellRefs.grid.current) {
      let cellGrid = grids.find((grid) => grid.element === cellRefs.grid.current);
      if (!cellGrid) {
        cellGrid = { element: cellRefs.grid.current, rows: [] };
        grids.push(cellGrid);
      }

      let cellRow = cellGrid.rows.find((row) => row.element === cellRefs.row.current);
      if (!cellRow) {
        cellRow = { element: cellRefs.row.current, cells: [] };
        cellGrid.rows.push(cellRow);
      }

      cellRow.cells.push(cellRefs.cell.current);
    }
  }

  return grids
    .sort(createSortByDocumentPosition((grid) => grid.element))
    .map((grid) =>
      grid.rows
        .sort(createSortByDocumentPosition((row) => row.element))
        .map((row) => row.cells.sort(createSortByDocumentPosition((cell) => cell))),
    );
}
