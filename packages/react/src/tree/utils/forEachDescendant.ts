import type { TreeItemId, TreeParentKeyed } from '../store/types';

import { getParentKey } from './itemIdKey';

/**
 * Visits the descendants of `parentId` (the root when `null`) in pre-order, without recursion,
 * so arbitrarily deep trees cannot overflow the call stack.
 * The children of an item are skipped when `shouldDescend` returns `false` for it.
 * The walk stops as soon as `visit` returns `false`.
 *
 * @returns `false` when `visit` stopped the walk, `true` otherwise.
 */
export function forEachDescendant(
  childrenLookup: TreeParentKeyed<readonly TreeItemId[]>,
  parentId: TreeItemId | null,
  visit: (itemId: TreeItemId) => boolean | void,
  shouldDescend?: (itemId: TreeItemId) => boolean,
): boolean {
  const pending: TreeItemId[] = [];
  const pushChildren = (itemId: TreeItemId | null) => {
    const children = childrenLookup[getParentKey(itemId)];
    if (children == null) {
      return;
    }
    for (let index = children.length - 1; index >= 0; index -= 1) {
      pending.push(children[index]);
    }
  };

  pushChildren(parentId);
  while (pending.length > 0) {
    const itemId = pending.pop()!;
    if (visit(itemId) === false) {
      return false;
    }
    if (shouldDescend == null || shouldDescend(itemId)) {
      pushChildren(itemId);
    }
  }
  return true;
}

/** The descendants of `parentId` (the root when `null`) that show while `expandedSet` holds the expanded items, in order. */
export function getVisibleDescendants(
  childrenLookup: TreeParentKeyed<readonly TreeItemId[]>,
  parentId: TreeItemId | null,
  expandedSet: ReadonlySet<TreeItemId>,
): TreeItemId[] {
  const result: TreeItemId[] = [];
  forEachDescendant(
    childrenLookup,
    parentId,
    (itemId) => {
      result.push(itemId);
    },
    (itemId) => expandedSet.has(itemId),
  );
  return result;
}
