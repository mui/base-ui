import type { TreeItemId, TreeState } from '../store/types';

import { selectors } from '../store/selectors';

/**
 * Returns `ids` sorted into the tree's preorder — the order the items render
 * in, independent of their expansion state — so multi-item operations preserve
 * the visual order regardless of the caller's input order (for example a
 * selection stored in click order).
 */
export function sortIdsByTreeOrder(ids: readonly TreeItemId[], state: TreeState): TreeItemId[] {
  const pathById = new Map<TreeItemId, number[]>();
  for (const id of ids) {
    pathById.set(id, getPreorderPath(id, state));
  }
  return [...ids].sort((a, b) => comparePaths(pathById.get(a)!, pathById.get(b)!));
}

/**
 * The chain of sibling indices from the root down to `id`. Comparing two such
 * paths lexicographically yields preorder, and it reads `itemIndex`
 * (sibling order) which does not depend on whether ancestors are expanded.
 */
function getPreorderPath(id: TreeItemId, state: TreeState): number[] {
  const path: number[] = [];
  let currentId: TreeItemId | null = id;
  while (currentId != null) {
    path.push(selectors.itemIndex(state, currentId));
    currentId = selectors.itemParentId(state, currentId);
  }
  return path.reverse();
}

function comparePaths(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
}
