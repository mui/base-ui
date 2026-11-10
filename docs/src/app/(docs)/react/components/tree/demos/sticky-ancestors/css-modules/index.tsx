'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import styles from './index.module.css';

const ITEM_HEIGHT = 28;

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
      <div className={styles.ScrollWrapper}>
        {/* @focus-start @padding 2 */}
        {/* @highlight-start */}
        {sticky.items.length > 0 && (
          <div className={styles.Sticky} style={{ insetInlineEnd: sticky.gutter }} aria-hidden>
            {sticky.items.map((item, index) => (
              // Keyboard users move through the rows, so the hidden copies only handle clicks.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                key={item.id}
                className={styles.Item}
                data-expandable=""
                style={{ '--tree-item-level': index + 1 } as React.CSSProperties}
                // The copy can't take focus, so it moves focus to the item's row.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => actionsRef.current?.focusItem(item.id)}
              >
                <div className={styles.ItemContent}>
                  <span className={styles.ExpansionTrigger} data-expanded="">
                    <ChevronIcon />
                  </span>
                  <span className={styles.Icon}>
                    <FolderIcon />
                  </span>
                  <span className={styles.Label}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* @highlight-end */}
        <Tree.List ref={listRef} aria-label="Sticky ancestors demo" className={styles.Tree}>
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
    <Tree.Item itemId={item.id} className={styles.Item}>
      <Tree.ItemContent className={styles.ItemContent}>
        <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
          <ChevronIcon />
        </Tree.ItemExpansionTrigger>
        <Tree.ItemGroupIndicator className={styles.Icon}>
          <FolderIcon />
        </Tree.ItemGroupIndicator>
        <span className={styles.Label}>{item.label}</span>
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
