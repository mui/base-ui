import type { TreeItemId, TreeItemKeyed } from '../store/types';
import { getItemIdKey } from './itemIdKey';

/**
 * A lookup keyed by consumer-supplied ids, with no prototype.
 *
 * A plain `{}` inherits `constructor`, `toString`, `__proto__` and friends, so
 * `itemMetaLookup['toString'] != null` is true for an item that does not exist —
 * and item ids are arbitrary strings, so `"constructor"` is a perfectly ordinary
 * file or node name. A null prototype makes a miss a miss.
 */
export function createLookup<V>(): Record<PropertyKey, V> {
  return Object.create(null);
}

/** Copy a lookup, preserving its null prototype (a `{ ...spread }` would not). */
export function cloneLookup<T extends object>(lookup: T): T {
  return Object.assign(Object.create(null), lookup);
}

export function buildChildrenIndexes(childrenIds: readonly TreeItemId[]): TreeItemKeyed<number> {
  const indexes: TreeItemKeyed<number> = createLookup();
  for (let index = 0; index < childrenIds.length; index += 1) {
    indexes[getItemIdKey(childrenIds[index])] = index;
  }
  return indexes;
}

// Children arrays are replaced, never mutated, once a lookup holds them.
const childrenIndexesCache = new WeakMap<readonly TreeItemId[], TreeItemKeyed<number>>();

/** The index of each id among `childrenIds`, built once per array. */
export function getChildrenIndexes(childrenIds: readonly TreeItemId[]): TreeItemKeyed<number> {
  let indexes = childrenIndexesCache.get(childrenIds);
  if (indexes === undefined) {
    indexes = buildChildrenIndexes(childrenIds);
    childrenIndexesCache.set(childrenIds, indexes);
  }
  return indexes;
}
