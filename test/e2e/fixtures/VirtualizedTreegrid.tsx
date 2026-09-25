import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  createVirtualizerRegistry,
  Virtualizer,
  VirtualizerHostContext,
  VirtualizerHostStateContext,
  type VirtualizerHost,
  type VirtualizerHostState,
  type VirtualizerItemMetadata,
} from '@base-ui/react/virtualizer';

/**
 * A windowed `treegrid` assembled from plain elements, standing in for a tree hosting the
 * virtualizer through the host contract. It exists for the screen-reader check that a
 * grid-shaped role still announces row position and count across a window: the rows sit below
 * the virtualizer's scrollport and its `role="presentation"` wrappers rather than directly
 * under the grid.
 *
 * Each row states its position among its siblings, which is what a tree means by position, so
 * the host declares `itemAria: 'none'` and the virtualizer states nothing of its own.
 */

interface TreeRow {
  id: string;
  name: string;
  level: number;
  /** Position among the row's siblings, and how many there are. */
  positionInSiblings: number;
  siblingCount: number;
  expanded?: boolean | undefined;
}

const FOLDER_COUNT = 20;
const FILES_PER_FOLDER = 50;

function createRows(): TreeRow[] {
  const rows: TreeRow[] = [];

  for (let folder = 0; folder < FOLDER_COUNT; folder += 1) {
    rows.push({
      id: `folder-${folder}`,
      name: `Folder ${folder + 1}`,
      level: 1,
      positionInSiblings: folder + 1,
      siblingCount: FOLDER_COUNT,
      expanded: true,
    });

    for (let file = 0; file < FILES_PER_FOLDER; file += 1) {
      rows.push({
        id: `folder-${folder}-file-${file}`,
        name: `File ${folder + 1}.${file + 1}`,
        level: 2,
        positionInSiblings: file + 1,
        siblingCount: FILES_PER_FOLDER,
      });
    }
  }

  return rows;
}

const rows = createRows();

/**
 * A row the first window never holds, for the screen reader to be taken to in one step rather
 * than through sixty announced key presses: the seventh child of the fifteenth folder. The
 * control that reveals it does not say the row's name, so that name is only ever spoken for the
 * row itself.
 */
const REVEAL_INDEX = 14 * (FILES_PER_FOLDER + 1) + 7;

const TreeItemContext = React.createContext<VirtualizerItemMetadata | undefined>(undefined);

/**
 * The tree's own item part: it takes the positional data attribute the virtualizer supplies and
 * states the ARIA itself, from the row's place among its siblings.
 */
function TreeItem(props: {
  row: TreeRow;
  active: boolean;
  onActivate: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) {
  const { active, onActivate, onKeyDown, row } = props;
  const virtualItem = React.useContext(TreeItemContext);

  // The host contract's development check: exactly one item part per row.
  useIsoLayoutEffect(() => virtualItem?.registerItem?.(), [virtualItem]);

  return (
    <div
      {...virtualItem?.props}
      role="row"
      aria-level={row.level}
      aria-posinset={row.positionInSiblings}
      aria-setsize={row.siblingCount}
      aria-selected={active}
      aria-expanded={row.expanded}
      // Counting the header row the grid does not have: rows are numbered from one.
      aria-rowindex={(virtualItem?.index ?? 0) + 1}
      tabIndex={active ? 0 : -1}
      onFocus={onActivate}
      onKeyDown={onKeyDown}
      style={{ alignItems: 'center', display: 'flex', height: 28 }}
    >
      <span role="gridcell" style={{ paddingInlineStart: row.level * 16 }}>
        {row.name}
      </span>
    </div>
  );
}

export default function VirtualizedTreegrid() {
  const registry = React.useRef(createVirtualizerRegistry()).current;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  // Whether the roving tabindex should take focus with it. Only keyboard movement does; pointing
  // at a row is already focusing it.
  const focusActiveRef = React.useRef(false);

  // The active row is mounted by the time this runs — publishing the activation is what keeps it
  // mounted — so focus lands on the element that now holds the roving tabindex, before paint.
  useIsoLayoutEffect(() => {
    if (!focusActiveRef.current) {
      return;
    }

    focusActiveRef.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.focus();
  }, [activeIndex]);

  const host = React.useMemo<VirtualizerHost>(
    () => ({
      componentName: 'Tree',
      // A tree states position among siblings, which the flat collection's own position is not.
      itemAria: 'none',
      registry,
      virtualItemContext: TreeItemContext,
    }),
    [registry],
  );

  const hostState = React.useMemo<VirtualizerHostState>(
    () => ({
      // The activation carries the scroll decision, so keyboard movement scrolls and nothing else
      // does.
      activeIndex: { index: activeIndex },
      items: rows,
    }),
    [activeIndex],
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    const next = activeIndex + (event.key === 'ArrowDown' ? 1 : -1);

    if (next >= 0 && next < rows.length) {
      focusActiveRef.current = true;
      setActiveIndex(next);
    }
  };

  return (
    <React.Fragment>
      <button
        type="button"
        data-testid="reveal"
        onClick={() => {
          focusActiveRef.current = true;
          setActiveIndex(REVEAL_INDEX);
        }}
      >
        Reveal a deep row
      </button>
      <div
        ref={gridRef}
        role="treegrid"
        aria-label="Files"
        aria-rowcount={rows.length}
        data-testid="treegrid"
      >
        <VirtualizerHostContext.Provider value={host}>
          <VirtualizerHostStateContext.Provider value={hostState}>
            <Virtualizer<TreeRow>
              getItemKey={(row) => row.id}
              itemHeight={28}
              style={{ height: 320, width: 320 }}
            >
              {(row, index) => (
                <TreeItem
                  row={row}
                  active={index === activeIndex}
                  onActivate={() => setActiveIndex(index)}
                  onKeyDown={handleKeyDown}
                />
              )}
            </Virtualizer>
          </VirtualizerHostStateContext.Provider>
        </VirtualizerHostContext.Provider>
      </div>
    </React.Fragment>
  );
}
