import type { TreeItemId, TreeState } from './types';

import { selectors } from './selectors';

/**
 * The first focusable row of the visible list from `start`, stepping by `step`.
 * An item that can't take focus has descendants that can't either, so the rows
 * of its subtree are skipped at once.
 */
function findFocusableRow(state: TreeState, start: number, step: 1 | -1): TreeItemId | null {
  const flatList = selectors.flatList(state);
  let index = start;
  while (index >= 0 && index < flatList.length) {
    const itemId = flatList[index];
    if (selectors.canItemBeFocused(state, itemId)) {
      return itemId;
    }
    if (step === 1) {
      index = Math.max(getIndexAfterSubtree(state, itemId), index + 1);
    } else {
      const outermostIndex = selectors.flatListIndex(state, getOutermostUnfocusable(state, itemId));
      index = (outermostIndex === -1 ? index : Math.min(outermostIndex, index)) - 1;
    }
  }
  return null;
}

/** The index of the row after the visible subtree of `itemId`. */
function getIndexAfterSubtree(state: TreeState, itemId: TreeItemId): number {
  // The rows of a subtree are contiguous, followed by the next sibling of its
  // root or of the closest ancestor that has one.
  for (let id: TreeItemId | null = itemId; id != null; id = selectors.itemParentId(state, id)) {
    const nextSiblingId = selectors.projectedNextSiblingId(state, id);
    if (nextSiblingId !== undefined) {
      return selectors.flatListIndex(state, nextSiblingId);
    }
  }
  return selectors.flatList(state).length;
}

/** The outermost of `itemId` and its ancestors that can't take focus. */
function getOutermostUnfocusable(state: TreeState, itemId: TreeItemId): TreeItemId {
  let outermost = itemId;
  for (
    let id = selectors.itemParentId(state, itemId);
    id != null && !selectors.canItemBeFocused(state, id);
    id = selectors.itemParentId(state, id)
  ) {
    outermost = id;
  }
  return outermost;
}

export function getNextNavigableItem(state: TreeState, itemId: TreeItemId): TreeItemId | null {
  const index = selectors.flatListIndex(state, itemId);
  return index === -1 ? null : findFocusableRow(state, index + 1, 1);
}

export function getPreviousNavigableItem(state: TreeState, itemId: TreeItemId): TreeItemId | null {
  const index = selectors.flatListIndex(state, itemId);
  return index === -1 ? null : findFocusableRow(state, index - 1, -1);
}

export function getFirstNavigableItem(state: TreeState): TreeItemId | null {
  return findFocusableRow(state, 0, 1);
}

export function getLastNavigableItem(state: TreeState): TreeItemId | null {
  return findFocusableRow(state, selectors.flatList(state).length - 1, -1);
}

/** The first focusable child of an expanded item. */
export function getFirstNavigableChild(state: TreeState, itemId: TreeItemId): TreeItemId | null {
  const next = getNextNavigableItem(state, itemId);
  return next != null && selectors.itemParentId(state, next) === itemId ? next : null;
}
