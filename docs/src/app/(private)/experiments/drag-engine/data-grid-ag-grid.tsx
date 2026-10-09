'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui/react/menu';
import { getHorizontalCollisionAfter } from './getHorizontalCollisionAfter';
import { DragPageAutoScroll } from '../../../(docs)/react/utils/draggable/demos/DragPageAutoScroll';

import theme from './theme.module.css';
import styles from './data-grid-ag-grid.module.css';

// AG-Grid-style live reordering: neighbors shift as soon as the drag crosses their edge.
// Rows and columns are windowed and auto-scroll. A dragged item that scrolls out unmounts,
// but the drag survives because the engine holds pointer capture on the document body,
// and the reorder is by id (`moveById`), so windowing can't corrupt it.

const columnKind = Draggable.createKind<string>('datagrid:column');
const rowKind = Draggable.createKind<string>('datagrid:row');

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 39;
const BODY_HEIGHT = 360;
const BODY_WIDTH = 720;
const OVERSCAN = 4;
const GRIP_WIDTH = 28;

interface Column {
  id: string;
  label: string;
  width: number;
}

interface Row {
  id: string;
  cells: Record<string, string>;
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
 * Insert the item with `fromId` just before or after `toId`. Returns `list` itself when
 * the order doesn't change, so React skips the re-render.
 */
function moveById<T extends { id: string }>(
  list: T[],
  fromId: string,
  toId: string,
  after: boolean,
): T[] {
  const from = list.findIndex((item) => item.id === fromId);
  const toOriginal = list.findIndex((item) => item.id === toId);
  if (from < 0 || toOriginal < 0 || fromId === toId) {
    return list;
  }
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  const to = next.findIndex((item) => item.id === toId);
  const insertAt = after ? to + 1 : to;
  next.splice(insertAt, 0, moved);
  const unchanged = next.every((item, index) => item.id === list[index].id);
  return unchanged ? list : next;
}

function Grip({ className }: { className?: string }) {
  return (
    <svg className={className} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="6" cy="2" r="1.2" />
        <circle cx="2" cy="7" r="1.2" />
        <circle cx="6" cy="7" r="1.2" />
        <circle cx="2" cy="12" r="1.2" />
        <circle cx="6" cy="12" r="1.2" />
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
      {/* No `Draggable.Handle`, so the whole label drags. The menu button is a sibling so
          the draggable never contains a button. */}
      <Draggable.Root
        kind={columnKind}
        collisionElement={getCollisionElement}
        payload={column.id}
        // The axis lock also pins the hit test to the header row, so headers keep
        // matching wherever the pointer is over the grid.
        modifiers={Draggable.restrictToHorizontalAxis}
        className={styles.headerCellInner}
      >
        <Grip className={styles.headerGrip} />
        {column.label}
        {/* Replaces the default clone of the header cell. Renders at the `Draggable.Provider`. */}
        <Draggable.Preview
          className={clsx(theme.tokens, styles.preview)}
          // A small chip just off the pointer.
          offset={{ x: 12, y: 8 }}
          // Keep the preview inside the grid, like AG Grid.
          modifiers={Draggable.restrictToElement(boundaryRef)}
        >
          {column.label}
        </Draggable.Preview>
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
          className={clsx(theme.tokens, styles.preview)}
          // A small chip just off the pointer.
          offset={{ x: 12, y: 8 }}
          // Keep the preview inside the grid, like AG Grid.
          modifiers={Draggable.restrictToElement(boundaryRef)}
        >
          {row.cells.name}
        </Draggable.Preview>
        {/* Rows drag from the grip only. */}
        <Draggable.Handle className={styles.rowGrip} aria-hidden>
          <Grip />
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

  const totalHeight = rows.length * ROW_HEIGHT;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + BODY_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = rows.slice(start, end);

  // Columns are windowed from a prefix sum since widths vary. Subtract the grip cell
  // before column 0 to convert a scroller x into column space.
  const columnOffsets = React.useMemo(() => buildColumnOffsets(columns), [columns]);
  const totalWidth = columnOffsets[columns.length];
  const contentWidth = GRIP_WIDTH + totalWidth;
  const windowLeft = scrollLeft - GRIP_WIDTH;
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

  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <h1 className={styles.title}>Data Grid — AG-Grid style</h1>
      <p className={styles.hint}>
        Live reordering: drag a column header (from anywhere over the grid) or a row (by its grip)
        and the others shift to make room the instant you cross a neighbour&apos;s edge
        (AG-Grid-style), not its midpoint — no drop indicator. Rows and columns are both windowed
        and auto-scroll; the dragged row/column keeps its drag alive even when it scrolls out of
        view and unmounts.
      </p>
      <p className={styles.meta}>
        Rendered rows {start}–{end} of {rows.length} · columns {startCol}–{endCol} of{' '}
        {columns.length}
      </p>

      <div ref={gridRef} className={styles.grid} style={{ width: BODY_WIDTH }}>
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
            <div className={styles.headerGripSpacer} style={{ width: GRIP_WIDTH }} />
            <div className={styles.columnSpacer} style={{ width: leadingWidth }} />
            <Draggable.CollisionProvider
              kind={columnKind}
              onCollisionChange={(eventDetails) => {
                const target = eventDetails.target;
                const delta =
                  eventDetails.location.current.input.clientX -
                  eventDetails.location.previous.input.clientX;
                if (delta === 0 && target?.payload === eventDetails.previousTarget?.payload) {
                  return;
                }
                if (target) {
                  setColumns((current) =>
                    moveById(
                      current,
                      eventDetails.source.payload,
                      target.payload,
                      getHorizontalCollisionAfter(target, delta),
                    ),
                  );
                }
              }}
            >
              {visibleColumns.map((column) => (
                <ColumnHeader key={column.id} column={column} boundaryRef={gridRef} />
              ))}
            </Draggable.CollisionProvider>
            <div className={styles.columnSpacer} style={{ width: trailingWidth }} />
          </div>

          <div className={styles.bodyInner} style={{ height: totalHeight, width: contentWidth }}>
            <div
              className={styles.bodyWindow}
              style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}
            >
              <Draggable.CollisionProvider
                kind={rowKind}
                onCollisionChange={(eventDetails) => {
                  const target = eventDetails.target;
                  const delta =
                    eventDetails.location.current.input.clientY -
                    eventDetails.location.previous.input.clientY;
                  if (delta === 0 && target?.payload === eventDetails.previousTarget?.payload) {
                    return;
                  }
                  if (target) {
                    setRows((current) =>
                      moveById(
                        current,
                        eventDetails.source.payload,
                        target.payload,
                        delta ? delta > 0 : target.getLocalPoint().y > 0.5,
                      ),
                    );
                  }
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

export default function DataGrid() {
  return (
    <Draggable.Provider>
      <DragPageAutoScroll accept={[columnKind, rowKind]} />
      <DataGridInner />
    </Draggable.Provider>
  );
}
