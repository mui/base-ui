'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui/react/menu';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getHorizontalCollisionAfter } from './getHorizontalCollisionAfter';
import { DragPageAutoScroll } from '../../../(docs)/react/utils/draggable/demos/DragPageAutoScroll';

import theme from './theme.module.css';
import styles from './data-grid-mui-x.module.css';

// MUI X Data Grid-style reordering, to compare with the AG Grid experiment. Nothing moves
// during the drag: the source dims, one line marks the insertion gap, and the move commits
// on drop. Rows and columns are windowed and auto-scroll, and a drag survives its source
// unmounting. Every index points into the full `columns` or `rows` array, not the slice.

const columnKind = Draggable.createKind<string>('datagrid-mui:column');
const rowKind = Draggable.createKind<string>('datagrid-mui:row');

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;
const BODY_HEIGHT = 360;
const BODY_WIDTH = 720;
const OVERSCAN = 4;
const HANDLE_WIDTH = 36;

interface Column {
  id: string;
  label: string;
  width: number;
}

interface Row {
  id: string;
  cells: Record<string, string>;
}

/** A gap (insertion index) on one axis where the dragged item would land. */
interface DropIndicator {
  axis: 'column' | 'row';
  index: number;
}

const METRIC_COUNT = 25;

const COLUMNS: Column[] = [
  { id: 'name', label: 'Name', width: 160 },
  { id: 'role', label: 'Role', width: 140 },
  { id: 'team', label: 'Team', width: 120 },
  { id: 'location', label: 'Location', width: 140 },
  { id: 'status', label: 'Status', width: 110 },
  // Uneven widths on purpose, so column windowing can't assume a fixed width.
  ...Array.from({ length: METRIC_COUNT }, (_, i) => ({
    id: `metric${i + 1}`,
    label: `Metric ${i + 1}`,
    width: 90 + (i % 4) * 30,
  })),
];

const FIRST_NAMES = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken'];
const ROLES = ['Engineer', 'Designer', 'PM', 'Researcher', 'Lead'];
const TEAMS = ['Core', 'Growth', 'Platform', 'Mobile'];
const LOCATIONS = ['Paris', 'Berlin', 'Tokyo', 'NYC', 'Lagos'];
const STATUSES = ['Active', 'Away', 'Focus'];

function buildRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const cells: Record<string, string> = {
      name: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${i + 1}`,
      role: ROLES[i % ROLES.length],
      team: TEAMS[i % TEAMS.length],
      location: LOCATIONS[i % LOCATIONS.length],
      status: STATUSES[i % STATUSES.length],
    };
    for (let m = 1; m <= METRIC_COUNT; m += 1) {
      cells[`metric${m}`] = `${((i * 37 + m * 13) % 99) + 1}`;
    }
    return { id: `r${i}`, cells };
  });
}

/** Prefix sum of column widths: `offsets[i]` is the x of column `i`, the last is the total. */
function buildColumnOffsets(columns: Column[]): number[] {
  const offsets = [0];
  for (let i = 0; i < columns.length; i += 1) {
    offsets.push(offsets[i] + columns[i].width);
  }
  return offsets;
}

/** Index of the column containing `x`, clamped to the first and last columns. */
function columnIndexAt(offsets: number[], x: number): number {
  let index = 0;
  const last = offsets.length - 2;
  while (index < last && offsets[index + 1] <= x) {
    index += 1;
  }
  return index;
}

/**
 * Move the item with `fromId` to gap `insertIndex` of the current array (0 to
 * `list.length`). Returns `list` itself when the order doesn't change.
 */
function moveToIndex<T extends { id: string }>(
  list: T[],
  fromId: string,
  insertIndex: number,
): T[] {
  const from = list.findIndex((item) => item.id === fromId);
  if (from < 0) {
    return list;
  }
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  const adjusted = from < insertIndex ? insertIndex - 1 : insertIndex;
  next.splice(adjusted, 0, moved);
  const unchanged = next.every((item, i) => item.id === list[i].id);
  return unchanged ? list : next;
}

function DragHandleIcon() {
  return (
    <svg
      width="10"
      height="16"
      viewBox="0 0 10 16"
      aria-hidden="true"
      className={styles.handleIcon}
    >
      <g fill="currentColor">
        <circle cx="3" cy="3" r="1.3" />
        <circle cx="7" cy="3" r="1.3" />
        <circle cx="3" cy="8" r="1.3" />
        <circle cx="7" cy="8" r="1.3" />
        <circle cx="3" cy="13" r="1.3" />
        <circle cx="7" cy="13" r="1.3" />
      </g>
    </svg>
  );
}

function ColumnMenuIcon() {
  return (
    <svg width="4" height="14" viewBox="0 0 4 14" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="2" cy="3" r="1.4" />
        <circle cx="2" cy="7" r="1.4" />
        <circle cx="2" cy="11" r="1.4" />
      </g>
    </svg>
  );
}

function getCollisionElement(element: HTMLElement) {
  return element.parentElement ?? element;
}

// Memoized, so an auto-scroll frame that keeps the same window skips every header.
const ColumnHeader = React.memo(function ColumnHeader({
  column,
  boundaryRef,
}: {
  column: Column;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={styles.headerCell} style={{ width: column.width }}>
      {/* The menu button is a sibling so the draggable never contains a button. */}
      <Draggable.Root
        kind={columnKind}
        collisionElement={getCollisionElement}
        payload={column.id}
        // The axis lock also pins the hit test to the header row, so headers keep
        // matching wherever the pointer is over the grid.
        modifiers={Draggable.restrictToHorizontalAxis}
        className={styles.headerCellInner}
      >
        {column.label}
        {/* Keep the default clone inside the grid. */}
        <Draggable.Preview modifiers={Draggable.restrictToElement(boundaryRef)} />
      </Draggable.Root>
      <Menu.Root>
        <Menu.Trigger
          className={styles.headerMenuButton}
          aria-label={`${column.label} column menu`}
        >
          <ColumnMenuIcon />
        </Menu.Trigger>
        <Menu.Portal>
          {/* Portaled out of the experiment root, so it carries the tokens itself. */}
          <Menu.Positioner sideOffset={4} align="end" className={theme.tokens}>
            <Menu.Popup className={styles.menuPopup}>
              {/* Stand-ins for the rest of a real column menu. */}
              <Menu.Item className={styles.menuItem} disabled>
                Pin column
              </Menu.Item>
              <Menu.Item className={styles.menuItem} disabled>
                Autosize this column
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
});

// Memoized, so an auto-scroll frame that keeps the same window skips every row.
const GridRow = React.memo(function GridRow({
  row,
  columns,
  leadingWidth,
  trailingWidth,
  boundaryRef,
}: {
  row: Row;
  /** The windowed column slice, not the full column list. */
  columns: Column[];
  leadingWidth: number;
  trailingWidth: number;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className={styles.row} style={{ height: ROW_HEIGHT }}>
      <Draggable.Root
        kind={rowKind}
        collisionElement={getCollisionElement}
        payload={row.id}
        modifiers={Draggable.restrictToVerticalAxis}
        className={styles.rowInner}
      >
        <Draggable.Preview
          className={clsx(theme.tokens, styles.rowGhost)}
          // A small chip just off the pointer.
          offset={{ x: 14, y: 10 }}
          // Keep the preview inside the grid.
          modifiers={Draggable.restrictToElement(boundaryRef)}
        >
          {row.cells.name}
        </Draggable.Preview>
        {/* Rows drag from the handle only. */}
        <Draggable.Handle className={styles.rowHandle} aria-label="Reorder row">
          <DragHandleIcon />
        </Draggable.Handle>
        {/* Spacers stand in for the unmounted columns, so mounted cells land at their true x. */}
        <div className={styles.columnSpacer} style={{ width: leadingWidth }} />
        {columns.map((column) => (
          <div key={column.id} className={styles.cell} style={{ width: column.width }}>
            {row.cells[column.id]}
          </div>
        ))}
        <div className={styles.columnSpacer} style={{ width: trailingWidth }} />
      </Draggable.Root>
    </div>
  );
});

function DataGridInner() {
  const [columns, setColumns] = React.useState<Column[]>(COLUMNS);
  const [rows, setRows] = React.useState<Row[]>(() => buildRows(500));
  const [scrollTop, setScrollTop] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [dropIndicator, setDropIndicatorState] = React.useState<DropIndicator | null>(null);

  const gridRef = React.useRef<HTMLDivElement | null>(null);

  // In a ref so the wheel listener reads it without re-subscribing.
  const source = Draggable.useActiveDrag([columnKind, rowKind]);
  const sourceRef = React.useRef(source);
  sourceRef.current = source;

  // The engine doesn't block wheel scrolling during a drag, so freeze the axis the drag
  // doesn't use. Wheel events bubble, so a non-passive listener on the grid also
  // cancels the body's scroll.
  React.useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return undefined;
    }
    const onWheel = (event: WheelEvent) => {
      const activeSource = sourceRef.current;
      if (!activeSource) {
        return;
      }
      if (columnKind.matches(activeSource) && event.deltaY !== 0) {
        event.preventDefault();
      } else if (rowKind.matches(activeSource) && event.deltaX !== 0) {
        event.preventDefault();
      }
    };
    grid.addEventListener('wheel', onWheel, { passive: false });
    return () => grid.removeEventListener('wheel', onWheel);
  }, []);

  const dropIndicatorRef = React.useRef<DropIndicator | null>(null);

  const setDropIndicator = useStableCallback((next: DropIndicator | null) => {
    const prev = dropIndicatorRef.current;
    if (prev?.axis === next?.axis && prev?.index === next?.index) {
      return;
    }
    dropIndicatorRef.current = next;
    setDropIndicatorState(next);
  });

  // The first half of the column at `pos` maps to gap `pos` and the second half to
  // `pos + 1`, so both sides of a shared border resolve to one gap and one line.
  const onColumnDragOver = useStableCallback((columnId: string, beforeHalf: boolean) => {
    const pos = columns.findIndex((c) => c.id === columnId);
    if (pos >= 0) {
      setDropIndicator({ axis: 'column', index: beforeHalf ? pos : pos + 1 });
    }
  });

  const onRowDragOver = useStableCallback((rowId: string, beforeHalf: boolean) => {
    const pos = rows.findIndex((r) => r.id === rowId);
    if (pos >= 0) {
      setDropIndicator({ axis: 'row', index: beforeHalf ? pos : pos + 1 });
    }
  });

  const totalHeight = rows.length * ROW_HEIGHT;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + BODY_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = rows.slice(start, end);

  // Columns are windowed from a prefix sum since widths vary. Subtract the handle cell
  // before column 0 to convert a scroller x into column space.
  const columnOffsets = React.useMemo(() => buildColumnOffsets(columns), [columns]);
  const totalWidth = columnOffsets[columns.length];
  const contentWidth = HANDLE_WIDTH + totalWidth;
  const windowLeft = scrollLeft - HANDLE_WIDTH;
  const startCol = Math.max(0, columnIndexAt(columnOffsets, windowLeft) - OVERSCAN);
  const endCol = Math.min(
    columns.length,
    columnIndexAt(columnOffsets, windowLeft + BODY_WIDTH) + 1 + OVERSCAN,
  );
  // Memoized so the rows' `columns` prop keeps its identity while the window holds.
  const visibleColumns = React.useMemo(
    () => columns.slice(startCol, endCol),
    [columns, startCol, endCol],
  );
  const leadingWidth = columnOffsets[startCol];
  const trailingWidth = totalWidth - columnOffsets[endCol];

  // Gap positions come from the prefix sum or the row height, without measuring. The
  // index is into the full list, so don't subtract the leading spacer. The column
  // indicator sits in the grid box, which doesn't scroll, so offset it by `scrollLeft`.
  const columnGapX =
    dropIndicator?.axis === 'column'
      ? HANDLE_WIDTH + columnOffsets[dropIndicator.index] - scrollLeft
      : null;
  const rowGapY = dropIndicator?.axis === 'row' ? dropIndicator.index * ROW_HEIGHT : null;

  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <h1 className={styles.title}>Data Grid — MUI X style</h1>
      <p className={styles.hint}>
        Drag a column header (dropping over any part of the grid, not just the header) or a row (by
        its handle). Nothing moves during the drag: the source dims and a single line marks the
        insertion point; the move commits on drop. The line snaps to gaps between items, so it never
        splits into two indicators side by side. Rows and columns are both windowed: only the
        visible slice is mounted, and dragging a column to either edge auto-scrolls sideways.
      </p>
      <p className={styles.meta}>
        Rendered rows {start}–{end} of {rows.length} · columns {startCol}–{endCol} of{' '}
        {columns.length}
      </p>

      <div ref={gridRef} className={styles.grid} style={{ width: BODY_WIDTH }}>
        {columnGapX !== null && (
          <div className={styles.columnIndicator} style={{ left: columnGapX - 1 }} />
        )}

        <Draggable.Viewport
          accept={[columnKind, rowKind]}
          // Auto-scroll only along the active drag's axis. Otherwise a column dragged
          // near the top edge would also scroll the rows away under it.
          onDragScroll={(eventDetails) => {
            const allowedDirection = rowKind.matches(eventDetails.source)
              ? 'vertical'
              : 'horizontal';
            if (eventDetails.direction !== allowedDirection) {
              eventDetails.cancel();
            }
          }}
          className={styles.viewport}
          style={{ height: HEADER_HEIGHT + BODY_HEIGHT }}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop);
            setScrollLeft(event.currentTarget.scrollLeft);
          }}
        >
          {/* The sticky header sits inside the scroller, so it scrolls sideways with the
              cells without a `scrollLeft` sync, and dragging a column to either end of
              it auto-scrolls. */}
          <div className={styles.header} style={{ width: contentWidth, height: HEADER_HEIGHT }}>
            <div className={styles.headerHandleSpacer} style={{ width: HANDLE_WIDTH }} />
            <div className={styles.columnSpacer} style={{ width: leadingWidth }} />
            <Draggable.CollisionProvider
              kind={columnKind}
              onCollisionChange={(eventDetails) => {
                if (eventDetails.target) {
                  onColumnDragOver(
                    eventDetails.target.payload,
                    !getHorizontalCollisionAfter(eventDetails.target),
                  );
                } else {
                  setDropIndicator(null);
                }
              }}
              onMoveEnd={(eventDetails) => {
                const target = eventDetails.target;
                if (target) {
                  setColumns((current) => {
                    const index = current.findIndex((item) => item.id === target.payload);
                    return index === -1
                      ? current
                      : moveToIndex(
                          current,
                          eventDetails.source.payload,
                          index + (getHorizontalCollisionAfter(target) ? 1 : 0),
                        );
                  });
                }
                setDropIndicator(null);
              }}
            >
              {visibleColumns.map((column) => (
                <ColumnHeader key={column.id} column={column} boundaryRef={gridRef} />
              ))}
            </Draggable.CollisionProvider>
            <div className={styles.columnSpacer} style={{ width: trailingWidth }} />
          </div>

          <div className={styles.bodyInner} style={{ height: totalHeight, width: contentWidth }}>
            {rowGapY !== null && (
              <div className={styles.rowIndicator} style={{ top: rowGapY - 1 }} />
            )}
            <div
              className={styles.bodyWindow}
              style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}
            >
              <Draggable.CollisionProvider
                kind={rowKind}
                onCollisionChange={(eventDetails) => {
                  if (eventDetails.target) {
                    onRowDragOver(
                      eventDetails.target.payload,
                      eventDetails.target.getLocalPoint().y <= 0.5,
                    );
                  } else {
                    setDropIndicator(null);
                  }
                }}
                onMoveEnd={(eventDetails) => {
                  const target = eventDetails.target;
                  if (target) {
                    setRows((current) => {
                      const index = current.findIndex((item) => item.id === target.payload);
                      return index === -1
                        ? current
                        : moveToIndex(
                            current,
                            eventDetails.source.payload,
                            index + (target.getLocalPoint().y > 0.5 ? 1 : 0),
                          );
                    });
                  }
                  setDropIndicator(null);
                }}
              >
                {visibleRows.map((row) => (
                  <GridRow
                    key={row.id}
                    row={row}
                    columns={visibleColumns}
                    leadingWidth={leadingWidth}
                    trailingWidth={trailingWidth}
                    boundaryRef={gridRef}
                  />
                ))}
              </Draggable.CollisionProvider>
            </div>
          </div>
        </Draggable.Viewport>
      </div>
    </div>
  );
}

export default function DataGridMuiX() {
  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={[columnKind, rowKind]} />
      <DataGridInner />
    </Draggable.Provider>
  );
}
