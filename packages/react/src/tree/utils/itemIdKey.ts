import type { TreeItemId, TreeParentLookupKey } from '../store/types';

import { TREE_VIEW_ROOT_PARENT_ID } from '../store/types';
import { itemId as ITEM_ID_ATTRIBUTE } from '../item/TreeItemDataAttributes';

/** The private attribute holding a row's `getItemIdKey`, for event delegation. */
export const ITEM_KEY_ATTRIBUTE = 'data-base-ui-tree-item-key';

/** Selects the rendered rows of a tree. */
export const ITEM_SELECTOR = `[${ITEM_ID_ATTRIBUTE}]`;

// `Map` keys compare by type, so `1` and `'1'` get separate entries. Bounded so
// an app that keeps generating fresh IDs does not grow it forever.
const MAX_CACHED_KEYS = 100_000;
const keyCache = new Map<TreeItemId, string>();

/**
 * Encodes consumer item IDs for object keys, React keys, and private DOM lookups.
 * JavaScript object properties and React both coerce numeric keys to strings, so
 * a type prefix is required to keep `1` distinct from `'1'`.
 */
export function getItemIdKey(itemId: TreeItemId): string {
  // Selectors call this several times per row on every store notification.
  // Reusing the same string skips the concatenation and lets the engine reuse
  // the interned property key for the lookup tables.
  let key = keyCache.get(itemId);
  if (key === undefined) {
    if (keyCache.size >= MAX_CACHED_KEYS) {
      keyCache.clear();
    }
    key = `${typeof itemId === 'number' ? 'number' : 'string'}:${String(itemId)}`;
    keyCache.set(itemId, key);
  }
  return key;
}

export function getParentKey(parentId: TreeItemId | null): TreeParentLookupKey {
  return parentId == null ? TREE_VIEW_ROOT_PARENT_ID : getItemIdKey(parentId);
}
