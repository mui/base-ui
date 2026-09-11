'use client';
import * as React from 'react';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './table.module.css';

/**
 * A semantic table whose body `<Virtualizer layout="table">` renders: column widths from a
 * `<colgroup>`, a sticky sortable header carrying `aria-sort`, a `<tfoot>`, and a scroll
 * container of the table's own around it. The rows are the `<tr>` elements the renderer returns.
 *
 * Everything else — sorting, filtering, the row cursor the keyboard moves, selection — is
 * implemented here, which is what an application owns when it drops the virtualizer into a table.
 */

interface Settings {
  enabled: boolean;
  rowCount: number;
  overscanPx: number;
  stickyHeader: boolean;
  varyingHeights: boolean;
  groupByStatus: boolean;
  showTrailing: boolean;
  scrollOnPointer: boolean;
  scrollAlign: string;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  enabled: {
    type: 'boolean',
    label: 'Virtualize',
    default: true,
  },
  rowCount: {
    type: 'number',
    label: 'Row count',
    default: 1500,
  },
  overscanPx: {
    type: 'number',
    // The table layout defaults to a scrollport's height; the list layout to 150px.
    label: 'Overscan in px (0 for the default)',
    default: 0,
  },
  stickyHeader: {
    type: 'boolean',
    label: 'Sticky header',
    default: true,
  },
  varyingHeights: {
    type: 'boolean',
    label: 'Vary row heights',
    default: true,
  },
  groupByStatus: {
    type: 'boolean',
    // Group headers become rows of the section, without a wrapper around each group.
    label: 'Group rows by status',
    default: false,
  },
  showTrailing: {
    type: 'boolean',
    // Trailing content is rendered as rows after the reserved space.
    label: 'Show a loading row after the rows',
    default: false,
  },
  scrollOnPointer: {
    type: 'boolean',
    label: 'Scroll on pointer highlight',
    default: false,
  },
  scrollAlign: {
    type: 'string',
    label: 'Alignment of "Scroll to row"',
    options: ['auto', 'start', 'center', 'end'],
    default: 'auto',
  },
};

type Status = 'Open' | 'Merged' | 'Closed';

interface Item {
  id: number;
  number: number;
  kind: 'Pull request' | 'Issue';
  title: string;
  description: string | null;
  status: Status;
  author: string;
  labels: string[];
  comments: number;
  updated: string;
}

interface StatusGroup {
  status: Status;
  items: Item[];
}

type SortKey = 'number' | 'title' | 'status' | 'author' | 'comments' | 'updated';
type SortDirection = 'ascending' | 'descending';

const STATUSES: Status[] = ['Open', 'Merged', 'Closed'];
const COMPONENTS = ['Popover', 'Menu', 'Select', 'Combobox', 'Dialog', 'Tooltip', 'Slider', 'Tabs'];
const PROBLEMS = [
  'closes on outside click',
  'ignores arrow keys',
  'flickers when opening',
  'loses focus on close',
  'overflows the viewport',
  'renders twice on mount',
  'drops the first keystroke',
];
const AUTHORS = ['atomiks', 'mj12albert', 'michaldudak', 'colmtuite', 'flaviendelangle'];
const LABELS = ['bug', 'enhancement', 'docs', 'a11y', 'regression', 'good first issue'];
const PAGE_SIZE = 10;

const COLUMNS: { key: SortKey | null; label: string; className: string }[] = [
  { key: 'number', label: '#', className: styles.NumberColumn },
  { key: null, label: 'Kind', className: styles.KindColumn },
  { key: 'title', label: 'Title', className: styles.TitleColumn },
  { key: 'status', label: 'Status', className: styles.StatusColumn },
  { key: 'author', label: 'Author', className: styles.AuthorColumn },
  { key: null, label: 'Labels', className: styles.LabelsColumn },
  { key: 'comments', label: 'Comments', className: styles.CommentsColumn },
  { key: 'updated', label: 'Updated', className: styles.UpdatedColumn },
];

function createItems(count: number): Item[] {
  return Array.from({ length: count }, (_, index) => {
    // Strides coprime with the list lengths, so every entry comes up.
    const title = `${COMPONENTS[index % COMPONENTS.length]} ${PROBLEMS[(index * 3) % PROBLEMS.length]}`;
    const date = new Date(Date.UTC(2026, 0, 1) + ((index * 7919) % 250) * 86_400_000);
    return {
      id: index,
      number: index + 1,
      kind: index % 3 === 0 ? 'Pull request' : 'Issue',
      title,
      // Every fourth row has a second line, so rows are not all the same height.
      description:
        index % 4 === 0
          ? `Reproduces inside a scroll container with a sticky header, and only once the ${COMPONENTS[index % COMPONENTS.length].toLowerCase()} has been opened from the keyboard.`
          : null,
      status: STATUSES[(index * 5) % STATUSES.length],
      author: AUTHORS[(index * 3) % AUTHORS.length],
      labels: [
        LABELS[index % LABELS.length],
        ...(index % 5 === 0 ? [LABELS[(index + 2) % LABELS.length]] : []),
      ],
      comments: (index * 13) % 47,
      updated: date.toISOString().slice(0, 10),
    };
  });
}

function compareItems(a: Item, b: Item, key: SortKey) {
  const left = a[key];
  const right = b[key];
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return String(left).localeCompare(String(right));
}

function groupByStatus(items: Item[]): StatusGroup[] {
  return STATUSES.map((status) => ({
    status,
    items: items.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);
}

export default function VirtualizerTableExperiment() {
  const { settings } = useExperimentSettings<Settings>();
  const tableId = React.useId();
  const rowIdPrefix = `${tableId}-row`;

  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<{ key: SortKey; direction: SortDirection }>({
    key: 'number',
    direction: 'ascending',
  });
  // The activation, not just the index: each one carries whether it should move the viewport, so
  // a hover and a keypress landing on the same row stay distinguishable.
  const [active, setActive] = React.useState<Virtualizer.ActiveItem | null>({ index: 0 });
  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<number>>(() => new Set());
  const [scrollToInput, setScrollToInput] = React.useState('1000');
  const [activeMetrics, setActiveMetrics] = React.useState<string>('—');

  const virtualizer = React.useRef<Virtualizer.Actions>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const allItems = React.useMemo(
    () => createItems(Math.max(0, settings.rowCount)),
    [settings.rowCount],
  );

  const sortedItems = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const filtered =
      trimmed === ''
        ? allItems
        : allItems.filter(
            (item) =>
              item.title.toLowerCase().includes(trimmed) ||
              item.author.toLowerCase().includes(trimmed) ||
              item.labels.some((label) => label.includes(trimmed)) ||
              String(item.number).includes(trimmed),
          );
    const sorted = [...filtered].sort((a, b) => compareItems(a, b, sort.key));
    return sort.direction === 'ascending' ? sorted : sorted.reverse();
  }, [allItems, query, sort]);

  const groups = React.useMemo(
    () => (settings.groupByStatus ? groupByStatus(sortedItems) : null),
    [settings.groupByStatus, sortedItems],
  );
  // The order the table shows, and therefore the one every index below refers to.
  const items = React.useMemo(
    () => (groups == null ? sortedItems : groups.flatMap((group) => group.items)),
    [groups, sortedItems],
  );

  // The collection is the application's, so clamping the cursor to it is too.
  const clampedActiveIndex =
    active == null || items.length === 0 ? null : Math.min(active.index, items.length - 1);
  const activeItem = clampedActiveIndex == null ? null : items[clampedActiveIndex];

  // Focus follows the cursor. The active row is always mounted — in the window, or retained
  // outside it — so it can take focus even before it has been scrolled into view. The
  // virtualizer scrolls it there; `preventScroll` keeps the browser from doing so as well.
  React.useEffect(() => {
    if (clampedActiveIndex == null || active?.scroll === false) {
      return;
    }
    const row = document.getElementById(`${rowIdPrefix}-${clampedActiveIndex}`);
    if (
      row != null &&
      row.contains(document.activeElement) === false &&
      scrollerRef.current?.contains(document.activeElement)
    ) {
      row.focus({ preventScroll: true });
    }
  }, [active, clampedActiveIndex, rowIdPrefix]);

  const moveActiveIndex = (delta: number) => {
    if (items.length === 0) {
      return;
    }
    const current = clampedActiveIndex ?? -1;
    setActive({ index: Math.max(0, Math.min(items.length - 1, current + delta)) });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        moveActiveIndex(1);
        break;
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        moveActiveIndex(-1);
        break;
      case 'PageDown':
        event.preventDefault();
        moveActiveIndex(PAGE_SIZE);
        break;
      case 'PageUp':
        event.preventDefault();
        moveActiveIndex(-PAGE_SIZE);
        break;
      case 'Home':
        event.preventDefault();
        setActive(items.length === 0 ? null : { index: 0, align: 'start' });
        break;
      case 'End':
        event.preventDefault();
        setActive(items.length === 0 ? null : { index: items.length - 1, align: 'end' });
        break;
      case 'Enter':
      case ' ':
        if (activeItem != null) {
          event.preventDefault();
          toggleSelected(activeItem.id);
        }
        break;
      default:
        break;
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    setSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === 'ascending' ? 'descending' : 'ascending' }
        : { key, direction: key === 'updated' ? 'descending' : 'ascending' },
    );
    setActive({ index: 0 });
  };

  const scrollToInputIndex = () => {
    const index = Number.parseInt(scrollToInput, 10);
    if (Number.isNaN(index)) {
      return;
    }
    virtualizer.current?.scrollToIndex(index, {
      align: settings.scrollAlign as Virtualizer.ActiveItem['align'],
    });
  };

  const readActiveMetrics = () => {
    if (clampedActiveIndex == null) {
      setActiveMetrics('—');
      return;
    }
    const metrics = virtualizer.current?.getItemMetrics(clampedActiveIndex);
    setActiveMetrics(
      metrics == null
        ? '—'
        : `offset ${Math.round(metrics.offset)}px, size ${Math.round(metrics.size)}px`,
    );
  };

  const columnCount = COLUMNS.length;

  const renderRow = (item: Item, index: number, rowProps: Virtualizer.ItemProps) => (
    // Keyboard handling lives on the scroll container, which the focused row bubbles to.
    <tr
      {...rowProps}
      id={`${rowIdPrefix}-${index}`}
      className={styles.Row}
      aria-rowindex={index + 2}
      aria-selected={selectedIds.has(item.id)}
      data-active={index === clampedActiveIndex || undefined}
      tabIndex={index === clampedActiveIndex ? 0 : -1}
      // A hover activates the row the cursor already rests on, so it asks for no scroll: moving
      // the table here would slide the next row under the pointer and cascade.
      onPointerMove={() => {
        if (index !== clampedActiveIndex) {
          setActive({ index, scroll: settings.scrollOnPointer });
        }
      }}
      onClick={() => {
        setActive({ index, scroll: false });
        toggleSelected(item.id);
      }}
    >
      <td className={styles.Cell}>{item.number}</td>
      <td className={styles.Cell}>{item.kind}</td>
      <td className={styles.Cell}>
        {item.title}
        {settings.varyingHeights && item.description != null && (
          <span className={styles.Description}>{item.description}</span>
        )}
      </td>
      <td className={styles.Cell}>{item.status}</td>
      <td className={styles.Cell}>{item.author}</td>
      <td className={styles.Cell}>{item.labels.join(', ')}</td>
      <td className={`${styles.Cell} ${styles.NumericCell}`}>{item.comments}</td>
      <td className={styles.Cell}>{item.updated}</td>
    </tr>
  );

  return (
    <div className={styles.Root}>
      <header className={styles.Header}>
        <h1>Virtualized table</h1>
        <p>
          A semantic <code>&lt;table&gt;</code> whose <code>&lt;tbody&gt;</code> is a{' '}
          <code>Virtualizer</code> with <code>layout=&quot;table&quot;</code>: column widths from a{' '}
          <code>&lt;colgroup&gt;</code>, a sticky sortable header, and a scroll container of the
          table&apos;s own. Tab into the table, then move the cursor with the arrow keys or{' '}
          <kbd>j</kbd>/<kbd>k</kbd>, page with <kbd>Page Up</kbd>/<kbd>Page Down</kbd>, jump with{' '}
          <kbd>Home</kbd>/<kbd>End</kbd>, and select with <kbd>Enter</kbd>.
        </p>
      </header>

      <div className={styles.Controls}>
        <div className={styles.Field}>
          <label className={styles.Label} htmlFor={`${tableId}-filter`}>
            Filter
          </label>
          <input
            id={`${tableId}-filter`}
            className={styles.Input}
            value={query}
            placeholder="e.g. Popover, a11y, or 1234"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive({ index: 0 });
            }}
          />
        </div>
        <div className={styles.Field}>
          <label className={styles.Label} htmlFor={`${tableId}-scroll-to`}>
            Row index
          </label>
          <input
            id={`${tableId}-scroll-to`}
            className={styles.Input}
            inputMode="numeric"
            value={scrollToInput}
            onChange={(event) => setScrollToInput(event.target.value)}
          />
        </div>
        <button type="button" className={styles.Button} onClick={scrollToInputIndex}>
          Scroll to row
        </button>
        <button type="button" className={styles.Button} onClick={readActiveMetrics}>
          Measure active row
        </button>
      </div>

      {/* The rows are the interactive elements: the key handler here receives the events they
          dispatch, whichever row holds focus, so the cursor can leave a row that unmounts. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div ref={scrollerRef} className={styles.Scroller} onKeyDown={handleKeyDown}>
        <table
          className={styles.Table}
          aria-label="Pull requests and issues"
          aria-rowcount={items.length + 1}
          data-sticky-header={settings.stickyHeader || undefined}
        >
          <colgroup>
            {COLUMNS.map((column) => (
              <col key={column.label} className={column.className} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={styles.HeaderCell}
                  aria-sort={column.key === sort.key ? sort.direction : undefined}
                >
                  {column.key == null ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      className={styles.SortButton}
                      onClick={() => toggleSort(column.key!)}
                    >
                      {column.label}
                      {column.key === sort.key && (
                        <span aria-hidden className={styles.SortIndicator}>
                          {sort.direction === 'ascending' ? '▲' : '▼'}
                        </span>
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <Virtualizer<Item>
            actionsRef={virtualizer}
            activeIndex={
              clampedActiveIndex == null || active == null
                ? null
                : { ...active, index: clampedActiveIndex }
            }
            enabled={settings.enabled}
            estimatedItemHeight={settings.varyingHeights ? 44 : 36}
            estimatedGroupHeaderHeight={32}
            overscanPx={settings.overscanPx > 0 ? settings.overscanPx : undefined}
            getItemKey={(item) => item.id}
            getGroupKey={(group: StatusGroup) => group.status}
            items={groups ?? items}
            layout="table"
            renderGroupHeader={(group: StatusGroup, _groupIndex, headerProps) => (
              // A header row of a real table is exposed to assistive technology as one, so the
              // `aria-hidden` meant for listbox group labels is dropped.
              <tr {...headerProps} aria-hidden={undefined} className={styles.GroupRow}>
                <th scope="rowgroup" colSpan={columnCount} className={styles.GroupCell}>
                  {group.status} · {group.items.length}
                </th>
              </tr>
            )}
            trailing={
              settings.showTrailing ? (
                <tr className={styles.TrailingRow} aria-busy>
                  <td colSpan={columnCount} className={styles.Cell}>
                    Loading more…
                  </td>
                </tr>
              ) : undefined
            }
          >
            {renderRow}
          </Virtualizer>
          <tfoot>
            <tr>
              <td colSpan={columnCount} className={styles.FooterCell}>
                {items.length.toLocaleString()} of {allItems.length.toLocaleString()} rows
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <dl className={styles.Status}>
        <div>
          <dt>Matches</dt>
          <dd>{items.length.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{activeItem ? `#${activeItem.number} (index ${clampedActiveIndex})` : 'none'}</dd>
        </div>
        <div>
          <dt>Selected</dt>
          <dd>{selectedIds.size}</dd>
        </div>
        <div>
          <dt>Mounted rows</dt>
          <dd>
            <MountedRowCount />
          </dd>
        </div>
        <div>
          <dt>Active row metrics</dt>
          <dd>{activeMetrics}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Counts the rows actually in the DOM, so the window can be seen shrinking as the table scrolls.
 */
function MountedRowCount() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const update = () => setCount(document.querySelectorAll('tbody [data-row-index]').length);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return count;
}
