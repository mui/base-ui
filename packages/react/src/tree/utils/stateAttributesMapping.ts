import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { TreeItemId } from '../store/types';

import type { TreeItemBaseState } from './useTreeItem';
import { getItemIdKey, ITEM_KEY_ATTRIBUTE } from './itemIdKey';
import * as TreeItemDataAttributes from '../item/TreeItemDataAttributes';
import * as TreeCheckboxItemDataAttributes from '../checkbox-item/TreeCheckboxItemDataAttributes';

const EXPANDED_HOOK = { [TreeItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeItemDataAttributes.collapsed]: '' };
const FILTER_MATCH_HOOK = { [TreeItemDataAttributes.filterMatch]: '' };
const CHECKED_HOOK = { [TreeCheckboxItemDataAttributes.checked]: '' };
const UNCHECKED_HOOK = { [TreeCheckboxItemDataAttributes.unchecked]: '' };

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

/**
 * Marks a checkbox part `data-checked` or `data-unchecked`. A mixed one only gets
 * `data-indeterminate`, from its `indeterminate` state, so pass `mixedMapping` then.
 */
export const checkedMapping: StateAttributesMapping<{ checked: boolean }> = {
  checked(v: boolean) {
    return v ? CHECKED_HOOK : UNCHECKED_HOOK;
  },
};

export const mixedMapping: StateAttributesMapping<{ checked: boolean }> = {
  checked: () => null,
};

/** Marks an expansion part `data-expanded` or `data-collapsed`. */
export const expansionMapping: StateAttributesMapping<{ expanded: boolean }> = {
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
};
