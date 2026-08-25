'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui/react/menu';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragMonitor } from '@base-ui/react/use-drag-monitor';
import theme from './theme.module.css';
import styles from './data-grid-mui-x.module.css';

// MUI X Data Grid–style reordering on the Plus pointer engine, contrasted with
// the AG-Grid demo. Nothing moves DURING the drag: the source dims and a single
// thin drop-indicator line (vertical for columns, horizontal for rows) shows
// where the item will land; the move COMMITS ON DROP.
//
// The indicator is modeled as an INSERTION INDEX (a gap between items), not an
// item edge — so the right half of column A and the left half of its neighbour B
// resolve to the same gap and render one line, never two side by side.
//
// Rows AND columns are windowed (both axes auto-scroll); the dragged row/column
// keeps its drag (and overlay preview) alive even when it scrolls out of view
// and unmounts.
//
// Windowing never leaks into the reorder math: every index below (the drop
// indicator's gap, `moveToIndex`, the indicator's x) is an index into the FULL
// `columns`/`rows` arrays, never into the rendered slice.

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
  // Uneven widths on purpose: column windowing must not assume a fixed width.
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

/**
 * Prefix sum of column widths: `offsets[i]` is column `i`'s x (relative to the
 * first column), and `offsets[columns.length]` is the total width. Columns have
 * variable widths, so the window can't be derived by dividing by a fixed width.
 */
function buildColumnOffsets(columns: Column[]): number[] {
  const offsets = [0];
  for (let i = 0; i < columns.length; i += 1) {
    offsets.push(offsets[i] + columns[i].width);
  }
  return offsets;
}

/** Index of the column containing `x` (clamped to the first/last column). */
function columnIndexAt(offsets: number[], x: number): number {
  let index = 0;
  const last = offsets.length - 2;
  while (index < last && offsets[index + 1] <= x) {
    index += 1;
  }
  return index;
}

/**
 * Move the item with `fromId` to the gap `insertIndex` (0..length, measured in
 * the current array). Adjusts for the item's own removal. Returns the input when
 * the order would not change.
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

function ColumnHeader({
  column,
  onDragOver,
  boundaryRef,
}: {
  column: Column;
  onDragOver: (columnId: string, beforeHalf: boolean) => void;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <DropTarget.Root
      accept={columnKind}
      trackDragOver={false}
      onDrag={({ self }) => {
        onDragOver(column.id, self.getLocalPoint().x < 0.5);
      }}
      className={styles.headerCell}
      style={{ width: column.width }}
    >
      {/* Grab anywhere on the label area. Columns do NOT reflow during the drag. The
          menu button is a sibling rather than a child, so the draggable never
          contains a button. */}
      <Draggable.Root
        kind={columnKind}
        payload={column.id}
        // A column only ever travels along the header row. The lock pins the
        // drop hit-test to that row too, so the header cell under the pointer's
        // x keeps resolving however far down the grid the pointer wanders — no
        // body cell needs to be a drop target of its own.
        modifiers={Draggable.restrictToHorizontalAxis}
        className={styles.headerCellInner}
      >
        {column.label}
        {/* The clone keeps the source label, dimensions and CSS-module class. Only
            its placement needs configuring: keep it inside the grid instead of
            trailing the pointer off the page. */}
        <Draggable.ClonedPreview modifiers={Draggable.restrictToElement(boundaryRef)} />
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
    </DropTarget.Root>
  );
}

function GridRow({
  row,
  columns,
  leadingWidth,
  trailingWidth,
  onDragOver,
  boundaryRef,
}: {
  row: Row;
  /** The windowed column slice, not the full column list. */
  columns: Column[];
  leadingWidth: number;
  trailingWidth: number;
  onDragOver: (rowId: string, beforeHalf: boolean) => void;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <DropTarget.Root
      accept={rowKind}
      trackDragOver={false}
      onDrag={({ self }) => {
        onDragOver(row.id, self.getLocalPoint().y < 0.5);
      }}
      className={styles.row}
      style={{ height: ROW_HEIGHT }}
    >
      <Draggable.Root
        kind={rowKind}
        payload={row.id}
        // A row only ever travels up and down the grid.
        modifiers={Draggable.restrictToVerticalAxis}
        className={styles.rowInner}
      >
        <Draggable.Preview
          className={clsx(theme.tokens, styles.rowGhost)}
          // A small chip, not a row-shaped preview: park it just off the pointer.
          offset={{ x: 14, y: 10 }}
          // Keep the preview within the grid container.
          modifiers={Draggable.restrictToElement(boundaryRef)}
        >
          {row.cells.name}
        </Draggable.Preview>
        {/* Rows initiate from the dedicated reorder handle cell only. */}
        <Draggable.Handle className={styles.rowHandle} aria-label="Reorder row">
          <DragHandleIcon />
        </Draggable.Handle>
        {/* Spacers stand in for the unmounted columns either side of the window,
            so the mounted cells land at their true x and the scroller keeps its
            full horizontal range. */}
        <div className={styles.columnSpacer} style={{ width: leadingWidth }} />
        {columns.map((column) => (
          <div key={column.id} className={styles.cell} style={{ width: column.width }}>
            {row.cells[column.id]}
          </div>
        ))}
        <div className={styles.columnSpacer} style={{ width: trailingWidth }} />
      </Draggable.Root>
    </DropTarget.Root>
  );
}

function DataGridInner() {
  const [columns, setColumns] = React.useState<Column[]>(COLUMNS);
  const [rows, setRows] = React.useState<Row[]>(() => buildRows(500));
  const [scrollTop, setScrollTop] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [dropIndicator, setDropIndicatorState] = React.useState<DropIndicator | null>(null);

  // The grid container: every column/row preview is constrained to it.
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  // The active drag source, kept in a ref so the non-React wheel listener can
  // read it synchronously without re-subscribing.
  const source = Draggable.useActiveDrag([columnKind, rowKind]);
  const sourceRef = React.useRef(source);
  sourceRef.current = source;

  // The engine doesn't block wheel/trackpad scroll during a pointer drag, so the
  // body could still be scrolled along the axis the drag doesn't use. Freeze that
  // axis: dragging a column must not let the wheel scroll the rows (and vice
  // versa). Wheel bubbles, so a non-passive listener on the grid cancels the
  // body's scroll too.
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

  // Refs so the stable drag callbacks read the latest order without re-registering.
  const columnsRef = React.useRef(columns);
  columnsRef.current = columns;
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;
  const dropIndicatorRef = React.useRef<DropIndicator | null>(null);

  const setDropIndicator = useStableCallback((next: DropIndicator | null) => {
    const prev = dropIndicatorRef.current;
    if (prev?.axis === next?.axis && prev?.index === next?.index) {
      return;
    }
    dropIndicatorRef.current = next;
    setDropIndicatorState(next);
  });

  // A column at position `pos`, hovered on its first/second half, maps to gap
  // `pos`/`pos + 1`. The two halves either side of a shared border resolve to
  // the same gap, so the indicator never duplicates.
  const onColumnDragOver = useStableCallback((columnId: string, beforeHalf: boolean) => {
    const pos = columnsRef.current.findIndex((c) => c.id === columnId);
    if (pos >= 0) {
      setDropIndicator({ axis: 'column', index: beforeHalf ? pos : pos + 1 });
    }
  });

  const onRowDragOver = useStableCallback((rowId: string, beforeHalf: boolean) => {
    const pos = rowsRef.current.findIndex((r) => r.id === rowId);
    if (pos >= 0) {
      setDropIndicator({ axis: 'row', index: beforeHalf ? pos : pos + 1 });
    }
  });

  useDragMonitor({
    accept: [columnKind, rowKind],
    // Commit only for a drag released over an accepting target.
    onDrop: ({ source: dropped }) => {
      const indicator = dropIndicatorRef.current;
      if (indicator?.axis === 'column') {
        setColumns((prev) => moveToIndex(prev, dropped.payload, indicator.index));
      } else if (indicator?.axis === 'row') {
        setRows((prev) => moveToIndex(prev, dropped.payload, indicator.index));
      }
    },
    // Clear the indicator however the drag ended, cancels included.
    onDragEnd: () => setDropIndicator(null),
  });

  const totalHeight = rows.length * ROW_HEIGHT;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + BODY_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = rows.slice(start, end);

  // Columns are windowed the same way, but off a prefix sum instead of a fixed
  // width. The handle cell sits before column 0, so subtract it to convert a
  // scroller x into column space.
  const columnOffsets = React.useMemo(() => buildColumnOffsets(columns), [columns]);
  const totalWidth = columnOffsets[columns.length];
  const contentWidth = HANDLE_WIDTH + totalWidth;
  const windowLeft = scrollLeft - HANDLE_WIDTH;
  const startCol = Math.max(0, columnIndexAt(columnOffsets, windowLeft) - OVERSCAN);
  const endCol = Math.min(
    columns.length,
    columnIndexAt(columnOffsets, windowLeft + BODY_WIDTH) + 1 + OVERSCAN,
  );
  const visibleColumns = columns.slice(startCol, endCol);
  const leadingWidth = columnOffsets[startCol];
  const trailingWidth = totalWidth - columnOffsets[endCol];

  // Pixel position of a gap, derived from the prefix sum / fixed row height (no
  // measuring), so a single indicator element is placed deterministically.
  // `dropIndicator.index` is an index into the FULL column list, so the gap is
  // `columnOffsets[index]` — the window's leading spacer must not be subtracted.
  // The indicator lives in the (unscrolled) grid box, so shift it by the scroll.
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
        its handle). Nothing moves during the drag: the source dims and a single blue line marks the
        insertion point; the move commits on drop. The line snaps to gaps between items, so it never
        splits into two indicators side by side. Rows and columns are both windowed: only the
        visible slice is mounted, and dragging a column to either edge auto-scrolls sideways.
      </p>
      <p className={styles.meta} data-testid="window-meta">
        Rendered rows {start}–{end} of {rows.length} · columns {startCol}–{endCol} of{' '}
        {columns.length}
      </p>

      <div ref={gridRef} className={styles.grid} style={{ width: BODY_WIDTH }}>
        {columnGapX !== null && (
          <div className={styles.columnIndicator} style={{ left: columnGapX - 1 }} />
        )}

        <DragAutoScroll.Root
          accept={[columnKind, rowKind]}
          // Auto-scroll only along the axis the active drag moves: a row drag
          // scrolls the viewport vertically, a column drag scrolls it
          // horizontally. The viewport scrolls on both axes, so without this a
          // column dragged near the top edge would also scroll the rows away
          // under it.
          allowedAxis={({ source: dragged }) =>
            rowKind.matches(dragged) ? 'vertical' : 'horizontal'
          }
          className={styles.viewport}
          style={{ height: HEADER_HEIGHT + BODY_HEIGHT }}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop);
            setScrollLeft(event.currentTarget.scrollLeft);
          }}
        >
          {/* The header sits inside the scroller, sticky so it only pins
              vertically: it scrolls horizontally with the cells without a
              `scrollLeft` sync, and its band is part of the auto-scroller's
              rect, so dragging a column along the header to either edge scrolls
              sideways. */}
          <div className={styles.header} style={{ width: contentWidth, height: HEADER_HEIGHT }}>
            <div className={styles.headerHandleSpacer} style={{ width: HANDLE_WIDTH }} />
            <div className={styles.columnSpacer} style={{ width: leadingWidth }} />
            {visibleColumns.map((column) => (
              <ColumnHeader
                key={column.id}
                column={column}
                onDragOver={onColumnDragOver}
                boundaryRef={gridRef}
              />
            ))}
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
              {visibleRows.map((row) => (
                <GridRow
                  key={row.id}
                  row={row}
                  columns={visibleColumns}
                  leadingWidth={leadingWidth}
                  trailingWidth={trailingWidth}
                  onDragOver={onRowDragOver}
                  boundaryRef={gridRef}
                />
              ))}
            </div>
          </div>
        </DragAutoScroll.Root>
      </div>
    </div>
  );
}

export default function DataGridMuiX() {
  return (
    <Draggable.PreviewProvider>
      <DataGridInner />
    </Draggable.PreviewProvider>
  );
}
