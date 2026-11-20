import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { TreeItemId, TreeState } from '../store/types';
import { itemMetaLookupSelector, projectedChildrenLookupSelector } from '../store/selectors';
import { getItemIdKey, getParentKey } from '../utils/itemIdKey';

// Cache flags only for rows that actually render an indent guide. Precomputing
// one copied ancestor array for every item costs O(N * depth) memory on a deep
// tree and the recursive DFS can overflow the call stack. The lookup identities
// are immutable, so they also make safe weak cache keys for stable array values.
const ancestorLastChildFlagsCache = new WeakMap<
  object,
  WeakMap<object, Map<TreeItemId, boolean[]>>
>();

/**
 * Returns a boolean array of length `level - 1` for the given item.
 * Each entry indicates whether the ancestor at that depth is the last child of its parent,
 * for IDE-style guide line truncation.
 */
export function selectAncestorLastChildFlags(state: TreeState, itemId: TreeItemId): boolean[] {
  const metaLookup = itemMetaLookupSelector(state);
  const childrenLookup = projectedChildrenLookupSelector(state);
  let byChildrenLookup = ancestorLastChildFlagsCache.get(metaLookup);
  if (byChildrenLookup == null) {
    byChildrenLookup = new WeakMap();
    ancestorLastChildFlagsCache.set(metaLookup, byChildrenLookup);
  }
  let byItem = byChildrenLookup.get(childrenLookup);
  if (byItem == null) {
    byItem = new Map();
    byChildrenLookup.set(childrenLookup, byItem);
  }
  const cached = byItem.get(itemId);
  if (cached != null) {
    return cached;
  }

  const reversedFlags: boolean[] = [];
  let ancestorId = metaLookup[getItemIdKey(itemId)]?.parentId ?? null;
  while (ancestorId != null) {
    const ancestorMeta = metaLookup[getItemIdKey(ancestorId)];
    if (ancestorMeta == null) {
      break;
    }
    const siblings = childrenLookup[getParentKey(ancestorMeta.parentId)] ?? EMPTY_ARRAY;
    reversedFlags.push(siblings[siblings.length - 1] === ancestorId);
    ancestorId = ancestorMeta.parentId;
  }

  const flags = reversedFlags.length === 0 ? EMPTY_ARRAY : reversedFlags.reverse();
  byItem.set(itemId, flags);
  return flags;
}
