import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { TreeItemId } from '../store/types';

import type { TreeItemBaseState } from './useTreeItem';
import { getItemIdKey, ITEM_KEY_ATTRIBUTE } from './itemIdKey';
import * as TreeItemDataAttributes from '../item/TreeItemDataAttributes';

const EXPANDED_HOOK = { [TreeItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeItemDataAttributes.collapsed]: '' };
const FILTER_MATCH_HOOK = { [TreeItemDataAttributes.filterMatch]: '' };

export const itemMapping: StateAttributesMapping<TreeItemBaseState> = {
  itemId(v: TreeItemId) {
    return { [TreeItemDataAttributes.itemId]: String(v), [ITEM_KEY_ATTRIBUTE]: getItemIdKey(v) };
  },
  // `aria-level` and `--tree-item-level` already expose it.
  level: () => null,
  // `collapsed` uses the default `data-collapsed`.
  filterMatch(v: boolean) {
    return v ? FILTER_MATCH_HOOK : null;
  },
};

/** Marks an expansion part `data-expanded` or `data-collapsed`. */
export const expansionMapping: StateAttributesMapping<{ expanded: boolean }> = {
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
};
