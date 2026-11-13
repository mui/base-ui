import type { TreeItemId, TreeState } from '../store/types';

import { selectors } from '../store/selectors';

/**
 * Given a set of item IDs, removes any item whose ancestor is also in the set.
 * This keeps only the topmost items, pruning dominated descendants.
 */
export function pruneDescendantIds(
  itemIds: ReadonlySet<TreeItemId>,
  state: TreeState,
): TreeItemId[] {
  const result: TreeItemId[] = [];
  for (const id of itemIds) {
    if (!isInSubtreeOf(state, selectors.itemParentId(state, id), itemIds)) {
      result.push(id);
    }
  }
  return result;
}

/** Whether `itemId` or one of its ancestors is in `rootIds`. */
export function isInSubtreeOf(
  state: TreeState,
  itemId: TreeItemId | null,
  rootIds: ReadonlySet<TreeItemId>,
): boolean {
  for (let id = itemId; id != null; id = selectors.itemParentId(state, id)) {
    if (rootIds.has(id)) {
      return true;
    }
  }
  return false;
}

/**
 * The ancestors of `itemIds` in the hierarchy `state` describes: the only
 * models a walk towards those items has to enter.
 */
export function collectAncestorIds(
  state: TreeState,
  itemIds: Iterable<TreeItemId>,
): Set<TreeItemId> {
  const ancestorIds = new Set<TreeItemId>();
  for (const itemId of itemIds) {
    for (
      let id = selectors.itemParentId(state, itemId);
      id != null && !ancestorIds.has(id);
      id = selectors.itemParentId(state, id)
    ) {
      ancestorIds.add(id);
    }
  }
  return ancestorIds;
}

/** The `index` among the children of `parentId` once `itemIds` leave them. */
export function getIndexAfterRemoval(
  state: TreeState,
  itemIds: readonly TreeItemId[],
  parentId: TreeItemId | null,
  index: number,
): number {
  let result = index;
  for (const id of itemIds) {
    if (selectors.itemParentId(state, id) === parentId) {
      const itemIndex = selectors.itemIndex(state, id);
      if (itemIndex !== -1 && itemIndex < index) {
        result -= 1;
      }
    }
  }
  return result;
}
