import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type { TreeState, TreeItemId, TreeItemMeta, TreeItemsState } from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';
import { buildItemsState } from './buildItemsState';

/**
 * Intermediate selector: bundles all accessor functions into a single memoized object.
 * This avoids exceeding the max arity of createSelectorMemoized (5 inputs + combiner).
 */
const itemAccessorsSelector = createSelectorMemoized(
  (state: TreeState) => state.getItemId,
  (state: TreeState) => state.getItemLabel,
  (state: TreeState) => state.getItemChildren,
  (state: TreeState) => state.isItemDisabled,
  (state: TreeState) => state.isItemSelectionDisabled,
  (getItemId, getItemLabel, getItemChildren, isItemDisabled, isItemSelectionDisabled) => ({
    getItemId,
    getItemLabel,
    getItemChildren,
    isItemDisabled,
    isItemSelectionDisabled,
  }),
);

/**
 * Core computation: builds all 4 lookup tables from items + accessors.
 * Recomputed only when items or accessor functions change.
 */
const rawItemsStateSelector = createSelectorMemoized(
  (state: TreeState) => state.items,
  itemAccessorsSelector,
  (items, acc): TreeItemsState =>
    buildItemsState(
      items,
      acc.getItemId,
      acc.getItemLabel,
      acc.getItemChildren,
      acc.isItemDisabled,
      acc.isItemSelectionDisabled,
    ),
);

/**
 * Item meta lookup with label and disabled overrides applied.
 */
const itemMetaLookupSelector = createSelectorMemoized(
  rawItemsStateSelector,
  (state: TreeState) => state.itemLabelOverrides,
  (state: TreeState) => state.itemDisabledOverrides,
  (raw, labelOverrides, disabledOverrides) => {
    const hasLabelOverrides = Object.keys(labelOverrides).length > 0;
    const hasDisabledOverrides = Object.keys(disabledOverrides).length > 0;
    if (!hasLabelOverrides && !hasDisabledOverrides) {
      return raw.itemMetaLookup;
    }
    const result = { ...raw.itemMetaLookup };
    for (const [id, label] of Object.entries(labelOverrides)) {
      if (result[id]) {
        result[id] = { ...result[id], label };
      }
    }
    for (const [id, disabled] of Object.entries(disabledOverrides)) {
      if (result[id]) {
        result[id] = { ...result[id], disabled };
      }
    }
    return result;
  },
);

/**
 * Item model lookup with label overrides applied.
 */
const itemModelLookupSelector = createSelectorMemoized(
  rawItemsStateSelector,
  (state: TreeState) => state.itemLabelOverrides,
  (raw, labelOverrides) => {
    if (Object.keys(labelOverrides).length === 0) {
      return raw.itemModelLookup;
    }
    const result = { ...raw.itemModelLookup };
    for (const [id, label] of Object.entries(labelOverrides)) {
      if (result[id]) {
        result[id] = { ...result[id], label };
      }
    }
    return result;
  },
);

/**
 * Ordered children IDs lookup — no overrides needed (structure is unchanged).
 */
const itemOrderedChildrenIdsLookupSelector = createSelector(
  (state: TreeState) => rawItemsStateSelector(state).itemOrderedChildrenIdsLookup,
);

/**
 * Children indexes lookup — no overrides needed (structure is unchanged).
 */
const itemChildrenIndexesLookupSelector = createSelector(
  (state: TreeState) => rawItemsStateSelector(state).itemChildrenIndexesLookup,
);

const itemOrderedChildrenIdsSelector = createSelector(
  (state: TreeState, itemId: TreeItemId | null): TreeItemId[] =>
    itemOrderedChildrenIdsLookupSelector(state)[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? EMPTY_ARRAY,
);

const isItemDisabledSelector = createSelector((state: TreeState, itemId: TreeItemId): boolean => {
  if (state.disabled) {
    return true;
  }
  const metaLookup = itemMetaLookupSelector(state);
  const meta = metaLookup[itemId];
  if (!meta) {
    return false;
  }
  if (meta.disabled) {
    return true;
  }
  if (meta.parentId != null) {
    return isItemDisabledSelector(state, meta.parentId);
  }
  return false;
});

const expandedItemsSetSelector = createSelectorMemoized(
  (state: TreeState) => state.expandedItems,
  (expandedItems): Set<TreeItemId> => new Set(expandedItems),
);

const isItemExpandedSelector = createSelector(
  expandedItemsSetSelector,
  (expandedSet, itemId: TreeItemId): boolean => expandedSet.has(itemId),
);

const selectedItemsNormalizedSelector = createSelectorMemoized(
  (state: TreeState) => state.selectedItems,
  (raw): readonly TreeItemId[] => {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw != null) {
      return [raw as TreeItemId];
    }
    return [];
  },
);

const selectedItemsSetSelector = createSelectorMemoized(
  selectedItemsNormalizedSelector,
  (items): Set<TreeItemId> => new Set(items),
);

const isItemSelectedSelector = createSelector(
  selectedItemsSetSelector,
  (set, itemId: TreeItemId): boolean => set.has(itemId),
);

const isSelectionDisabledSelector = createSelector(
  (state: TreeState): boolean => state.selectionMode === 'none',
);

const canItemBeSelectedSelector = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean => {
    if (state.selectionMode === 'none') {
      return false;
    }
    const meta = itemMetaLookupSelector(state)[itemId];
    if (!meta) {
      return false;
    }
    if (!meta.selectable) {
      return false;
    }
    return !isItemDisabledSelector(state, itemId);
  },
);

export type CheckboxSelectionStatus = 'checked' | 'indeterminate' | 'empty';

const checkboxSelectionStatusSelector = createSelector(
  (state: TreeState, itemId: TreeItemId): CheckboxSelectionStatus => {
    if (isItemSelectedSelector(state, itemId)) {
      return 'checked';
    }

    let hasSelectedDescendant = false;
    let hasUnSelectedDescendant = false;

    const traverseDescendants = (idToTraverse: TreeItemId) => {
      if (idToTraverse !== itemId) {
        if (isItemSelectedSelector(state, idToTraverse)) {
          hasSelectedDescendant = true;
        } else {
          hasUnSelectedDescendant = true;
        }
      }

      if (hasSelectedDescendant && hasUnSelectedDescendant) {
        return;
      }

      const children = itemOrderedChildrenIdsSelector(state, idToTraverse);
      for (const childId of children) {
        traverseDescendants(childId);
      }
    };

    traverseDescendants(itemId);

    const shouldSelectBasedOnDescendants = state.selectionPropagation.parents;
    if (shouldSelectBasedOnDescendants) {
      if (hasSelectedDescendant && hasUnSelectedDescendant) {
        return 'indeterminate';
      }
      if (hasSelectedDescendant && !hasUnSelectedDescendant) {
        return 'checked';
      }
      return 'empty';
    }

    if (hasSelectedDescendant) {
      return 'indeterminate';
    }

    return 'empty';
  },
);

const isItemFocusedSelector = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean => state.focusedItemId === itemId,
);

const defaultFocusableItemIdSelector = createSelectorMemoized(
  selectedItemsNormalizedSelector,
  expandedItemsSetSelector,
  itemMetaLookupSelector,
  (state: TreeState) => state.itemFocusableWhenDisabled,
  itemOrderedChildrenIdsLookupSelector,
  (
    selectedItems,
    expandedSet,
    metaLookup,
    disabledFocusable,
    childrenLookup,
  ): TreeItemId | null => {
    // Try to focus the first selected and visible item
    for (const selectedId of selectedItems) {
      const meta = metaLookup[selectedId];
      if (!meta) {
        continue;
      }
      // Check if the item is visible (all ancestors are expanded)
      let isVisible = true;
      let parentId = meta.parentId;
      while (parentId != null) {
        if (!expandedSet.has(parentId)) {
          isVisible = false;
          break;
        }
        parentId = metaLookup[parentId]?.parentId ?? null;
      }
      if (isVisible && (disabledFocusable || !meta.disabled)) {
        return selectedId;
      }
    }

    // Fall back to first navigable root item
    const rootChildren = childrenLookup[TREE_VIEW_ROOT_PARENT_ID] ?? [];
    for (const childId of rootChildren) {
      const meta = metaLookup[childId];
      if (meta && (disabledFocusable || !meta.disabled)) {
        return childId;
      }
    }

    return null;
  },
);

const isItemBeingEditedSelector = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean => state.editedItemId === itemId,
);

const isItemDefaultFocusableSelector = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean => {
    const currentFocusedId = state.focusedItemId;
    if (currentFocusedId != null) {
      return currentFocusedId === itemId;
    }
    return defaultFocusableItemIdSelector(state) === itemId;
  },
);

const itemSiblingsCountSelector = createSelector((state: TreeState, itemId: TreeItemId): number => {
  const meta = itemMetaLookupSelector(state)[itemId];
  if (!meta) {
    return 0;
  }
  const parentKey = meta.parentId ?? TREE_VIEW_ROOT_PARENT_ID;
  return itemOrderedChildrenIdsLookupSelector(state)[parentKey]?.length ?? 0;
});

const itemPositionInSetSelector = createSelector((state: TreeState, itemId: TreeItemId): number => {
  const meta = itemMetaLookupSelector(state)[itemId];
  if (!meta) {
    return 1;
  }
  const parentKey = meta.parentId ?? TREE_VIEW_ROOT_PARENT_ID;
  return (itemChildrenIndexesLookupSelector(state)[parentKey]?.[itemId] ?? 0) + 1;
});

export const selectors = {
  itemMetaLookup: itemMetaLookupSelector,
  itemMeta: createSelector(
    (state: TreeState, itemId: TreeItemId | null): TreeItemMeta | null =>
      itemMetaLookupSelector(state)[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? null,
  ),
  itemModel: createSelector(
    (state: TreeState, itemId: TreeItemId) => itemModelLookupSelector(state)[itemId],
  ),
  itemOrderedChildrenIds: itemOrderedChildrenIdsSelector,
  itemIndex: createSelector((state: TreeState, itemId: TreeItemId): number => {
    const meta = itemMetaLookupSelector(state)[itemId];
    if (!meta) {
      return -1;
    }
    return (
      itemChildrenIndexesLookupSelector(state)[meta.parentId ?? TREE_VIEW_ROOT_PARENT_ID]?.[
        itemId
      ] ?? -1
    );
  }),
  itemParentId: createSelector(
    (state: TreeState, itemId: TreeItemId): TreeItemId | null =>
      itemMetaLookupSelector(state)[itemId]?.parentId ?? null,
  ),
  itemDepth: createSelector(
    (state: TreeState, itemId: TreeItemId): number =>
      itemMetaLookupSelector(state)[itemId]?.depth ?? 0,
  ),
  isItemDisabled: isItemDisabledSelector,
  canItemBeFocused: createSelector(
    (state: TreeState, itemId: TreeItemId): boolean =>
      state.itemFocusableWhenDisabled || !isItemDisabledSelector(state, itemId),
  ),
  isItemExpanded: isItemExpandedSelector,
  isItemExpandable: createSelector(
    (state: TreeState, itemId: TreeItemId): boolean =>
      itemMetaLookupSelector(state)[itemId]?.expandable ?? false,
  ),
  flatList: createSelectorMemoized(
    itemOrderedChildrenIdsLookupSelector,
    expandedItemsSetSelector,
    (childrenLookup, expandedSet): TreeItemId[] => {
      const result: TreeItemId[] = [];

      const appendChildren = (parentId: string) => {
        const children = childrenLookup[parentId];
        if (!children) {
          return;
        }
        for (const childId of children) {
          result.push(childId);
          if (expandedSet.has(childId)) {
            appendChildren(childId);
          }
        }
      };

      appendChildren(TREE_VIEW_ROOT_PARENT_ID);
      return result;
    },
  ),
  isItemSelected: isItemSelectedSelector,
  isMultiSelectEnabled: createSelector(
    (state: TreeState): boolean => state.selectionMode === 'multiple',
  ),
  isSelectionDisabled: isSelectionDisabledSelector,
  canItemBeSelected: canItemBeSelectedSelector,
  checkboxSelectionStatus: checkboxSelectionStatusSelector,
  selectionPropagationRules: createSelector((state: TreeState) => state.selectionPropagation),
  focusedItemId: createSelector((state: TreeState): TreeItemId | null => state.focusedItemId),
  isItemFocused: isItemFocusedSelector,
  defaultFocusableItemId: defaultFocusableItemIdSelector,
  isItemBeingEdited: isItemBeingEditedSelector,
  editedItemId: createSelector((state: TreeState): TreeItemId | null => state.editedItemId),
  isItemLoading: createSelector(
    (state: TreeState, itemId: TreeItemId | null): boolean =>
      state.lazyLoadedItems?.loading[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? false,
  ),
  itemError: createSelector(
    (state: TreeState, itemId: TreeItemId | null): Error | undefined =>
      state.lazyLoadedItems?.errors[itemId ?? TREE_VIEW_ROOT_PARENT_ID],
  ),
  itemPropsAndState: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => itemMetaLookupSelector(state)[itemId],
    (state: TreeState, itemId: TreeItemId) => isItemExpandedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemSelectedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemFocusedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemDisabledSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemBeingEditedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => canItemBeSelectedSelector(state, itemId),
    isSelectionDisabledSelector,
    (state: TreeState, itemId: TreeItemId) => isItemDefaultFocusableSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => itemSiblingsCountSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => itemPositionInSetSelector(state, itemId),
    (
      meta,
      expanded,
      isSelected,
      focused,
      disabled,
      editing,
      canBeSelected,
      selectionDisabled,
      isDefaultFocusable,
      siblingsCount,
      posInSet,
      itemId: TreeItemId,
    ) => {
      if (!meta) {
        throw new Error(`Base UI: Could not find the item metadata for item with id "${itemId}".`);
      }

      // Per WAI-ARIA, when selection is supported, all focusable treeitems
      // must have aria-selected set to true or false.
      // Only omit it entirely when the tree doesn't support selection at all.
      const ariaSelected = selectionDisabled || !canBeSelected ? undefined : isSelected;

      return {
        props: {
          role: 'treeitem' as const,
          'aria-expanded': meta.expandable ? expanded : undefined,
          'aria-selected': ariaSelected,
          'aria-level': meta.depth + 1,
          'aria-setsize': siblingsCount,
          'aria-posinset': posInSet,
          'aria-disabled': disabled || undefined,
          tabIndex: isDefaultFocusable ? 0 : -1,
        },
        state: {
          itemId,
          expanded,
          expandable: meta.expandable,
          selected: isSelected,
          focused,
          disabled,
          editing,
          depth: meta.depth,
        },
      };
    },
  ),
  checkboxItemPropsAndState: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => itemMetaLookupSelector(state)[itemId],
    (state: TreeState, itemId: TreeItemId) => isItemExpandedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemFocusedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemDisabledSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemBeingEditedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => canItemBeSelectedSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => checkboxSelectionStatusSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => isItemDefaultFocusableSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => itemSiblingsCountSelector(state, itemId),
    (state: TreeState, itemId: TreeItemId) => itemPositionInSetSelector(state, itemId),
    (
      meta,
      expanded,
      focused,
      disabled,
      editing,
      canBeSelected,
      checkboxStatus,
      isDefaultFocusable,
      siblingsCount,
      posInSet,
      itemId: TreeItemId,
    ) => {
      if (!meta) {
        throw new Error(`Base UI: Could not find the item metadata for item with id "${itemId}".`);
      }

      // Compute aria-checked from checkbox selection status.
      // The expensive checkboxSelectionStatus traversal only runs for TreeCheckboxItem,
      // not for every TreeItem in the tree.
      const checked = checkboxStatus === 'checked';
      const indeterminate = checkboxStatus === 'indeterminate';
      let ariaChecked: boolean | 'mixed' | undefined;
      if (!canBeSelected) {
        ariaChecked = undefined;
      } else if (checked) {
        ariaChecked = true;
      } else if (indeterminate) {
        ariaChecked = 'mixed';
      } else {
        ariaChecked = false;
      }

      return {
        props: {
          role: 'treeitem' as const,
          'aria-expanded': meta.expandable ? expanded : undefined,
          'aria-checked': ariaChecked,
          'aria-level': meta.depth + 1,
          'aria-setsize': siblingsCount,
          'aria-posinset': posInSet,
          'aria-disabled': disabled || undefined,
          tabIndex: isDefaultFocusable ? 0 : -1,
        },
        state: {
          itemId,
          expanded,
          expandable: meta.expandable,
          checked,
          unchecked: !checked && !indeterminate,
          indeterminate,
          focused,
          disabled,
          editing,
          depth: meta.depth,
        },
      };
    },
  ),
  labelProps: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => itemMetaLookupSelector(state)[itemId]?.label ?? '',
    (state: TreeState, itemId: TreeItemId) => state.editedItemId === itemId,
    (label, editing, _itemId: TreeItemId) => ({
      label,
      editing,
    }),
  ),
  expansionTriggerProps: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => itemMetaLookupSelector(state)[itemId],
    (state: TreeState, itemId: TreeItemId) => isItemExpandedSelector(state, itemId),
    (meta, expanded, _itemId: TreeItemId) => ({
      expanded,
      expandable: meta?.expandable ?? false,
    }),
  ),
  groupIndicatorProps: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => itemMetaLookupSelector(state)[itemId],
    (state: TreeState, itemId: TreeItemId) => isItemExpandedSelector(state, itemId),
    (meta, expanded, _itemId: TreeItemId) => ({
      expanded,
      expandable: meta?.expandable ?? false,
    }),
  ),
  loadingIndicatorProps: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => state.lazyLoadedItems?.loading[itemId] ?? false,
    (loading, _itemId: TreeItemId) => ({
      loading,
    }),
  ),
  errorIndicatorProps: createSelectorMemoized(
    (state: TreeState, itemId: TreeItemId) => state.lazyLoadedItems?.errors[itemId],
    (error, _itemId: TreeItemId) => ({
      error,
      hasError: error != null,
    }),
  ),
};
