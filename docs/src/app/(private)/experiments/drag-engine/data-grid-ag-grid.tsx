'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui/react/menu';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import theme from './theme.module.css';
import styles from './data-grid-ag-grid.module.css';

// AG-Grid-style live reordering on the Plus pointer engine.
//
//   • Drag a column header sideways and the columns shift live (move/insert),
//     committing the instant you cross a neighbour's edge (AG-Grid-style, not
//     its midpoint) — no drop required. The drag is locked to the horizontal
//     axis, so the reorder keeps tracking from anywhere over the grid, not just
//     the header.
//   • Drag a row by its grip and the rows shift the same way.
//   • The body is windowed on BOTH axes (only the visible rows/columns +
//     overscan are mounted) and auto-scrolls while dragging. When the dragged
//     row/column scrolls out of the window it is genuinely unmounted — the drag
//     survives anyway because the engine anchors pointer capture on the document
//     body, not the dragged element.
//
// Each body cell is keyed by its column id and each row by its row id, so a
// reorder MOVES the existing DOM nodes (cheap, and keeps them connected) rather
// than remounting them.
//
// The reorder itself is id-based (`moveById`), so windowing can't corrupt it:
// no index into the rendered slice ever reaches the model.

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
 * Move the item with `fromId` to just before/after `toId` (insert semantics).
 * Returns the original list when the order would not change so React can skip
 * the re-render.
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
  // Bail out when the resulting order matches the input — avoids a needless
  // setState (and the flicker it could cause near an edge).
  const unchanged = next.every((item, index) => item.id === list[index].id);
  return unchanged ? list : next;
}

/**
 * Resolve the insertion side from the pointer's *travel direction* rather than
 * the neighbour's midpoint. The drop target fires as soon as the pointer crosses
 * the neighbour's near edge, so committing on direction reproduces AG-Grid's
 * snappy "reorder on edge, not midpoint" feel. Gating on direction — move the
 * dragged item toward the pointer, never against it — stops an uneven-width
 * neighbour that slides under the cursor right after a swap from oscillating.
 *
 * Returns `null` when the pointer hasn't moved along the axis (e.g. an
 * auto-scroll tick reusing the last coordinate) so the caller skips the reorder.
 */
function afterFromDirection(
  ref: React.MutableRefObject<number | null>,
  pointer: number,
  initial: number,
): boolean | null {
  const previous = ref.current ?? initial;
  ref.current = pointer;
  if (pointer === previous) {
    return null;
  }
  return pointer > previous;
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

function ColumnHeader({
  column,
  onReorder,
  boundaryRef,
}: {
  column: Column;
  onReorder: (draggedId: string, targetId: string, pointer: number, initial: number) => void;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  // The same header is also a drop target: the moment the dragged column crosses
  // this one's near edge, shift it into place (see `afterFromDirection`).
  return (
    <DropTarget.Root
      accept={columnKind}
      trackDragOver={false}
      onDrag={({ source, location }) => {
        const draggedId = source.payload;
        if (draggedId === column.id) {
          return;
        }
        onReorder(
          draggedId,
          column.id,
          location.current.input.clientX,
          location.initial.input.clientX,
        );
      }}
      className={styles.headerCell}
      style={{ width: column.width }}
    >
      {/* Grab anywhere on the label area (no `Draggable.Handle`). The menu button is
          a sibling rather than a child, so the draggable never contains a button. */}
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
        <Grip className={styles.headerGrip} />
        {column.label}
        {/* Renders nothing here: the content is published to the `Draggable.PreviewProvider`,
            replacing the default clone of the header cell. */}
        <Draggable.Preview
          className={clsx(theme.tokens, styles.preview)}
          // A small chip, not a header-shaped preview: park it just off the pointer.
          offset={{ x: 12, y: 8 }}
          // Keep the preview inside the grid (AG-Grid-style): it sticks to the grid
          // edge instead of following the pointer off into the page.
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
    </DropTarget.Root>
  );
}

function GridRow({
  row,
  columns,
  leadingWidth,
  trailingWidth,
  onRowReorder,
  boundaryRef,
}: {
  row: Row;
  /** The windowed column slice, not the full column list. */
  columns: Column[];
  leadingWidth: number;
  trailingWidth: number;
  onRowReorder: (draggedId: string, targetId: string, pointer: number, initial: number) => void;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  // As the dragged row crosses this one's near edge, shift it into place — the
  // same edge-commit direction logic as columns (see `afterFromDirection`).
  return (
    <DropTarget.Root
      accept={rowKind}
      trackDragOver={false}
      onDrag={({ source, location }) => {
        const draggedId = source.payload;
        if (draggedId === row.id) {
          return;
        }
        onRowReorder(
          draggedId,
          row.id,
          location.current.input.clientY,
          location.initial.input.clientY,
        );
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
          className={clsx(theme.tokens, styles.preview)}
          // A small chip, not a row-shaped preview: park it just off the pointer.
          offset={{ x: 12, y: 8 }}
          // Keep the preview inside the grid (AG-Grid-style).
          modifiers={Draggable.restrictToElement(boundaryRef)}
        >
          {row.cells.name}
        </Draggable.Preview>
        {/* Rows initiate from the grip only, so cell text stays selectable. */}
        <Draggable.Handle render={<span />} className={styles.rowGrip} aria-hidden>
          <Grip />
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

  // The grid container: every column/row preview is constrained to it.
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  // The active drag source, kept in a ref so the non-React wheel listener can
  // read it synchronously without re-subscribing.
  const source = Draggable.useActiveDrag([columnKind, rowKind]);
  const sourceRef = React.useRef(source);
  sourceRef.current = source;

  // The last pointer coordinate seen along each axis, used by `afterFromDirection`
  // to resolve the insertion side from travel direction. Reset when a drag ends so
  // the next drag seeds from its own grab point rather than a stale coordinate.
  const columnPointerRef = React.useRef<number | null>(null);
  const rowPointerRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!source) {
      columnPointerRef.current = null;
      rowPointerRef.current = null;
    }
  }, [source]);

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

  const reorderColumns = useStableCallback(
    (draggedId: string, targetId: string, pointer: number, initial: number) => {
      const after = afterFromDirection(columnPointerRef, pointer, initial);
      if (after === null) {
        return;
      }
      setColumns((prev) => moveById(prev, draggedId, targetId, after));
    },
  );
  const reorderRows = useStableCallback(
    (draggedId: string, targetId: string, pointer: number, initial: number) => {
      const after = afterFromDirection(rowPointerRef, pointer, initial);
      if (after === null) {
        return;
      }
      setRows((prev) => moveById(prev, draggedId, targetId, after));
    },
  );

  const totalHeight = rows.length * ROW_HEIGHT;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + BODY_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = rows.slice(start, end);

  // Columns are windowed the same way, but off a prefix sum instead of a fixed
  // width. The grip cell sits before column 0, so subtract it to convert a
  // scroller x into column space.
  const columnOffsets = React.useMemo(() => buildColumnOffsets(columns), [columns]);
  const totalWidth = columnOffsets[columns.length];
  const contentWidth = GRIP_WIDTH + totalWidth;
  const windowLeft = scrollLeft - GRIP_WIDTH;
  const startCol = Math.max(0, columnIndexAt(columnOffsets, windowLeft) - OVERSCAN);
  const endCol = Math.min(
    columns.length,
    columnIndexAt(columnOffsets, windowLeft + BODY_WIDTH) + 1 + OVERSCAN,
  );
  const visibleColumns = columns.slice(startCol, endCol);
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
      <p className={styles.meta} data-testid="window-meta">
        Rendered rows {start}–{end} of {rows.length} · columns {startCol}–{endCol} of{' '}
        {columns.length}
      </p>

      <div ref={gridRef} className={styles.grid} style={{ width: BODY_WIDTH }}>
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
            <div className={styles.headerGripSpacer} style={{ width: GRIP_WIDTH }} />
            <div className={styles.columnSpacer} style={{ width: leadingWidth }} />
            {visibleColumns.map((column) => (
              <ColumnHeader
                key={column.id}
                column={column}
                onReorder={reorderColumns}
                boundaryRef={gridRef}
              />
            ))}
            <div className={styles.columnSpacer} style={{ width: trailingWidth }} />
          </div>

          <div className={styles.bodyInner} style={{ height: totalHeight, width: contentWidth }}>
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
                  onRowReorder={reorderRows}
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

export default function DataGrid() {
  return (
    <Draggable.PreviewProvider>
      <DataGridInner />
    </Draggable.PreviewProvider>
  );
}
