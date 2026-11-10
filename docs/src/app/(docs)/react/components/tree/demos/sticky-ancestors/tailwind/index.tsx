'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';

const ITEM_HEIGHT = 28;

// A fixed row height, matching `ITEM_HEIGHT`.
const ITEM_CLASS =
  'box-border flex h-7 items-center gap-2 px-2 leading-[1.5] select-none ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:2.5rem] ' +
  'hover:bg-neutral-100 dark:hover:bg-neutral-800 ' +
  'data-selected:bg-neutral-200 dark:data-selected:bg-neutral-700 ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight] ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const TRIGGER_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-none bg-transparent p-0 text-neutral-500 dark:text-neutral-400 ' +
  '[&_svg]:size-3 [&_svg]:transition-transform [&_svg]:duration-150 [&_svg]:ease-[ease] motion-reduce:[&_svg]:transition-none data-expanded:[&_svg]:rotate-90';

const HIERARCHY_CLASS =
  'ms-[calc(1.25rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-2 ' +
  'ps-[var(--leaf-offset)]';

const ICON_CLASS = 'size-4 shrink-0 text-neutral-500 dark:text-neutral-400';

const LABEL_CLASS = 'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap';

// An opaque background hides the rows the pinned ones cover, and a hairline
// under the deepest one reads as a boundary.
const STICKY_CLASS =
  'absolute top-0 start-0 z-1 bg-white text-inherit shadow-[0_1px_0_var(--color-neutral-200)] ' +
  'dark:bg-neutral-950 dark:shadow-[0_1px_0_var(--color-neutral-700)]';

export default function ExampleStickyAncestorsTree() {
  const actionsRef = React.useRef<Tree.Root.Actions>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const sticky = useStickyAncestors(actionsRef, listRef, ITEM_HEIGHT);

  return (
    <Tree.Root
      items={items}
      defaultExpandedItems={expandedByDefault}
      expandOnClick
      actionsRef={actionsRef}
      // @highlight-start
      onItemHighlighted={(itemId) => {
        if (itemId !== undefined) {
          sticky.revealItem(itemId);
        }
      }}
      // @highlight-end
    >
      <div className="relative box-content h-96 w-64 overflow-hidden border border-neutral-200 bg-white text-sm/[1.5] text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white">
        {/* @focus-start @padding 2 */}
        {/* @highlight-start */}
        {sticky.items.length > 0 && (
          <div className={STICKY_CLASS} style={{ insetInlineEnd: sticky.gutter }} aria-hidden>
            {sticky.items.map((item, index) => (
              // Keyboard users move through the rows, so the hidden copies only handle clicks.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                key={item.id}
                className={ITEM_CLASS}
                data-expandable=""
                style={{ '--tree-item-level': index + 1 } as React.CSSProperties}
                // The copy can't take focus, so it moves focus to the item's row.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => actionsRef.current?.focusItem(item.id)}
              >
                <div className={HIERARCHY_CLASS}>
                  <span className={TRIGGER_CLASS} data-expanded="">
                    <ChevronIcon />
                  </span>
                  <span className={ICON_CLASS}>
                    <FolderIcon />
                  </span>
                  <span className={LABEL_CLASS}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* @highlight-end */}
        <Tree.List
          ref={listRef}
          aria-label="Sticky ancestors demo"
          className="h-full w-full overflow-y-auto p-0"
        >
          {renderItem}
        </Tree.List>
        {/* @focus-end */}
      </div>
    </Tree.Root>
  );
}

/**
 * Finds the ancestors to pin above a list of rows of `rowHeight`: the ones of
 * the row each pinned ancestor covers.
 */
function useStickyAncestors(
  actionsRef: React.RefObject<Tree.Root.Actions | null>,
  scrollerRef: React.RefObject<HTMLElement | null>,
  rowHeight: number,
) {
  const [sticky, setSticky] = React.useState<{ items: Tree.DefaultItem[]; gutter: number }>({
    items: [],
    gutter: 0,
  });
  const frame = useAnimationFrame();

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller == null) {
      return undefined;
    }
    const update = () => {
      const actions = actionsRef.current;
      if (actions == null) {
        return;
      }
      const items = actions.getItemModels(getStickyIds(actions, scroller.scrollTop, rowHeight));
      // Keeps the scrollbar clear of the pinned rows.
      const gutter = scroller.offsetWidth - scroller.clientWidth;
      setSticky((previous) =>
        previous.gutter === gutter &&
        previous.items.length === items.length &&
        previous.items.every((item, index) => item === items[index])
          ? previous
          : { items, gutter },
      );
    };
    const scheduleUpdate = () => {
      if (frame.currentId == null) {
        frame.request(update);
      }
    };
    scheduleUpdate();
    scroller.addEventListener('scroll', scheduleUpdate, { passive: true });
    // Expanding and collapsing items moves the rows without a scroll.
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(scroller, { childList: true, subtree: true });
    return () => {
      frame.cancel();
      scroller.removeEventListener('scroll', scheduleUpdate);
      observer.disconnect();
    };
  }, [actionsRef, scrollerRef, rowHeight, frame]);

  // Scrolls a focused row out from under the ancestors pinned above it.
  const revealItem = (itemId: Tree.ItemId) => {
    const actions = actionsRef.current;
    const scroller = scrollerRef.current;
    const index = actions == null ? -1 : getRowIds(actions).indexOf(itemId);
    if (actions == null || scroller == null || index === -1) {
      return;
    }
    const top = (index - actions.getAncestorIds(itemId).length) * rowHeight;
    if (scroller.scrollTop > top) {
      scroller.scrollTop = top;
    }
  };

  return { ...sticky, revealItem };
}

function getStickyIds(actions: Tree.Root.Actions, scrollTop: number, rowHeight: number) {
  const rows = getRowIds(actions);
  const topRow = Math.floor(scrollTop / rowHeight);
  const ids: Tree.ItemId[] = [];
  for (let depth = 0; ; depth += 1) {
    // The row the ancestor pinned at this depth would cover.
    const itemId = rows[topRow + depth];
    if (itemId === undefined) {
      return ids;
    }
    const chain = [...actions.getAncestorIds(itemId), itemId];
    const candidate = chain[depth];
    const nextRowId = rows[topRow + depth + 1];
    if (
      candidate === undefined ||
      (depth > 0 && chain[depth - 1] !== ids[depth - 1]) ||
      // A parent is pinned once its own row starts to scroll under the pinned rows.
      (candidate === itemId &&
        (scrollTop % rowHeight === 0 ||
          nextRowId === undefined ||
          actions.getParentId(nextRowId) !== itemId))
    ) {
      return ids;
    }
    ids.push(candidate);
  }
}

/** The IDs of the items the list renders, in order. */
function getRowIds(
  actions: Tree.Root.Actions,
  parentId: Tree.ItemId | null = null,
  rows: Tree.ItemId[] = [],
) {
  for (const itemId of actions.getChildIds(parentId)) {
    rows.push(itemId);
    if (actions.isItemExpanded(itemId)) {
      getRowIds(actions, itemId, rows);
    }
  }
  return rows;
}

function renderItem(item: Tree.DefaultItem) {
  return (
    <Tree.Item itemId={item.id} className={ITEM_CLASS}>
      <Tree.ItemContent className={HIERARCHY_CLASS}>
        <Tree.ItemExpansionTrigger className={TRIGGER_CLASS}>
          <ChevronIcon />
        </Tree.ItemExpansionTrigger>
        <Tree.ItemGroupIndicator className={ICON_CLASS}>
          <FolderIcon />
        </Tree.ItemGroupIndicator>
        <span className={LABEL_CLASS}>{item.label}</span>
      </Tree.ItemContent>
    </Tree.Item>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor">
      <path
        d="M4.5 2L8.5 6L4.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path
        d="M2 4.5C2 3.67 2.67 3 3.5 3H6.38a1 1 0 01.7.29l1.13 1.13a1 1 0 00.7.29H12.5c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 012 12V4.5z"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A single deep chain so sticky is visible on first scroll.
function generateItems(): Tree.DefaultItem[] {
  const levels = 6;
  const leavesPerLevel = 6;

  function build(depth: number, path: string): Tree.DefaultItem[] {
    const result: Tree.DefaultItem[] = [];
    for (let i = 0; i < leavesPerLevel; i += 1) {
      result.push({ id: `${path}.leaf-${i}`, label: `Leaf ${i + 1}` });
    }
    if (depth < levels) {
      const nestedId = `${path}.level-${depth + 1}`;
      result.push({
        id: nestedId,
        label: `Level ${depth + 1}`,
        children: build(depth + 1, nestedId),
      });
    }
    return result;
  }

  return [
    {
      id: 'level-1',
      label: 'Level 1',
      children: build(1, 'level-1'),
    },
  ];
}

function collectExpandedIds(nodes: readonly Tree.DefaultItem[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.children) {
      ids.push(String(node.id));
      ids.push(...collectExpandedIds(node.children));
    }
  }
  return ids;
}

const items = generateItems();
const expandedByDefault = collectExpandedIds(items);
