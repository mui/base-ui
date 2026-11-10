'use client';
import * as React from 'react';
import type { Tree } from '@base-ui/react/tree';
import { ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

interface StickyAncestors<TItem> {
  /** The ancestors to pin above the list, from the root down. */
  items: TItem[];
  /** The width of the scrollbar, which the pinned rows keep clear of. */
  gutter: number;
}

/**
 * Finds the ancestors to pin above a list of rows of `rowHeight`: the ones of
 * the row each pinned ancestor covers. The pinned rows must start at the same
 * offset from the top of `scrollerRef` as the list.
 */
export function useStickyAncestors<TItem>(
  actionsRef: React.RefObject<Tree.Root.Actions<TItem> | null>,
  scrollerRef: React.RefObject<HTMLElement | null>,
  rowHeight: number,
) {
  const [sticky, setSticky] = React.useState<StickyAncestors<TItem>>({ items: [], gutter: 0 });
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
    // Expanding, collapsing, adding and renaming items change the rows without a scroll.
    const observer = new (ownerWindow(scroller).MutationObserver)(scheduleUpdate);
    observer.observe(scroller, { childList: true, subtree: true, characterData: true });
    return () => {
      frame.cancel();
      scroller.removeEventListener('scroll', scheduleUpdate);
      observer.disconnect();
    };
  }, [actionsRef, scrollerRef, rowHeight, frame]);

  /** Scrolls the row of a highlighted item out from under the ancestors pinned above it. */
  const revealItem = useStableCallback((itemId: Tree.ItemId) => {
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
  });

  return { ...sticky, revealItem };
}

function getStickyIds(actions: Tree.Root.Actions<any>, scrollTop: number, rowHeight: number) {
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
  actions: Tree.Root.Actions<any>,
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
