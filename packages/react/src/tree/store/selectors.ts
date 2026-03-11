import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import type { TreeState, TreeItemId, TreeItemMeta } from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';

const EMPTY_CHILDREN: TreeItemId[] = [];

// =============================================================================
// Internal selectors (used by composite selectors and store methods)
// =============================================================================

export const itemMetaLookup = createSelector((state: TreeState) => state.itemMetaLookup);

export const itemMeta = createSelector(
  (state: TreeState, itemId: TreeItemId | null): TreeItemMeta | null =>
    state.itemMetaLookup[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? null,
);

export const itemModel = createSelector(
  (state: TreeState, itemId: TreeItemId) => state.itemModelLookup[itemId],
);

export const itemOrderedChildrenIds = createSelector(
  (state: TreeState, itemId: TreeItemId | null): TreeItemId[] =>
    state.itemOrderedChildrenIdsLookup[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? EMPTY_CHILDREN,
);

export const itemIndex = createSelector((state: TreeState, itemId: TreeItemId): number => {
  const meta = state.itemMetaLookup[itemId];
  if (!meta) {
    return -1;
  }
  return state.itemChildrenIndexesLookup[meta.parentId ?? TREE_VIEW_ROOT_PARENT_ID]?.[itemId] ?? -1;
});

export const itemParentId = createSelector(
  (state: TreeState, itemId: TreeItemId): TreeItemId | null =>
    state.itemMetaLookup[itemId]?.parentId ?? null,
);

export const itemDepth = createSelector(
  (state: TreeState, itemId: TreeItemId): number => state.itemMetaLookup[itemId]?.depth ?? 0,
);

export const isItemDisabled = createSelector((state: TreeState, itemId: TreeItemId): boolean => {
  const meta = state.itemMetaLookup[itemId];
  if (!meta) {
    return false;
  }
  if (meta.disabled) {
    return true;
  }
  if (meta.parentId != null) {
    return isItemDisabled(state, meta.parentId);
  }
  return false;
});

export const canItemBeFocused = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean =>
    state.itemFocusableWhenDisabled || !isItemDisabled(state, itemId),
);

// === Expansion selectors ===

const expandedItemsSet = createSelectorMemoized(
  (state: TreeState) => state.expandedItems,
  (expandedItems): Set<TreeItemId> => new Set(expandedItems),
);

export const isItemExpanded = createSelector(
  expandedItemsSet,
  (expandedSet, itemId: TreeItemId): boolean => expandedSet.has(itemId),
);

export const isItemExpandable = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean =>
    state.itemMetaLookup[itemId]?.expandable ?? false,
);

/**
 * Computes the flat list of visible items.
 * Only expanded items have their children included.
 * This is the core of the flat DOM rendering.
 */
export const flatList = createSelectorMemoized(
  (state: TreeState) => state.itemOrderedChildrenIdsLookup,
  expandedItemsSet,
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
);

// === Selection selectors ===

const selectedItemsNormalized = createSelectorMemoized(
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

const selectedItemsSet = createSelectorMemoized(
  selectedItemsNormalized,
  (items): Set<TreeItemId> => new Set(items),
);

export const isItemSelected = createSelector(selectedItemsSet, (set, itemId: TreeItemId): boolean =>
  set.has(itemId),
);

export const isMultiSelectEnabled = createSelector(
  (state: TreeState): boolean => state.selectionMode === 'multiple',
);

export const isSelectionDisabled = createSelector(
  (state: TreeState): boolean => state.selectionMode === 'none',
);

export const canItemBeSelected = createSelector((state: TreeState, itemId: TreeItemId): boolean => {
  if (state.selectionMode === 'none') {
    return false;
  }
  const meta = state.itemMetaLookup[itemId];
  if (!meta) {
    return false;
  }
  if (!meta.selectable) {
    return false;
  }
  return !isItemDisabled(state, itemId);
});

export type CheckboxSelectionStatus = 'checked' | 'indeterminate' | 'empty';

export const checkboxSelectionStatus = createSelector(
  (state: TreeState, itemId: TreeItemId): CheckboxSelectionStatus => {
    if (isItemSelected(state, itemId)) {
      return 'checked';
    }

    let hasSelectedDescendant = false;
    let hasUnSelectedDescendant = false;

    const traverseDescendants = (idToTraverse: TreeItemId) => {
      if (idToTraverse !== itemId) {
        if (isItemSelected(state, idToTraverse)) {
          hasSelectedDescendant = true;
        } else {
          hasUnSelectedDescendant = true;
        }
      }

      if (hasSelectedDescendant && hasUnSelectedDescendant) {
        return;
      }

      const children = itemOrderedChildrenIds(state, idToTraverse);
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

export const selectionPropagationRules = createSelector(
  (state: TreeState) => state.selectionPropagation,
);

// === Focus selectors ===

export const focusedItemId = createSelector(
  (state: TreeState): TreeItemId | null => state.focusedItemId,
);

export const isItemFocused = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean => state.focusedItemId === itemId,
);

export const defaultFocusableItemId = createSelectorMemoized(
  selectedItemsNormalized,
  expandedItemsSet,
  (state: TreeState) => state.itemMetaLookup,
  (state: TreeState) => state.itemFocusableWhenDisabled,
  (state: TreeState) => state.itemOrderedChildrenIdsLookup,
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

// === Label editing selectors ===

export const isItemBeingEdited = createSelector(
  (state: TreeState, itemId: TreeItemId): boolean => state.editedItemId === itemId,
);

export const editedItemId = createSelector(
  (state: TreeState): TreeItemId | null => state.editedItemId,
);

// === Lazy loading selectors ===

export const isItemLoading = createSelector(
  (state: TreeState, itemId: TreeItemId | null): boolean =>
    state.lazyLoadedItems?.loading[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? false,
);

export const itemError = createSelector(
  (state: TreeState, itemId: TreeItemId | null): Error | undefined =>
    state.lazyLoadedItems?.errors[itemId ?? TREE_VIEW_ROOT_PARENT_ID],
);

// =============================================================================
// Composite selectors — one per component part
// =============================================================================

/**
 * Tree.Item — returns all props and state for the item element.
 */
export const itemProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => state.itemMetaLookup[itemId],
  (state: TreeState, itemId: TreeItemId) => isItemExpanded(state, itemId),
  (state: TreeState, itemId: TreeItemId) => checkboxSelectionStatus(state, itemId),
  (state: TreeState, itemId: TreeItemId) => isItemFocused(state, itemId),
  (state: TreeState, itemId: TreeItemId) => isItemDisabled(state, itemId),
  (state: TreeState, itemId: TreeItemId) => isItemBeingEdited(state, itemId),
  (state: TreeState, itemId: TreeItemId) => canItemBeSelected(state, itemId),
  (state: TreeState) => state.focusedItemId,
  defaultFocusableItemId,
  (state: TreeState) => state.itemOrderedChildrenIdsLookup,
  (state: TreeState) => state.itemChildrenIndexesLookup,
  (
    meta,
    expanded,
    selectionStatus,
    focused,
    disabled,
    editing,
    canBeSelected,
    currentFocusedId,
    defaultFocusableId,
    childrenLookup,
    indexesLookup,
    itemId: TreeItemId,
  ) => {
    if (!meta) {
      return null;
    }

    // Compute ARIA checked
    let ariaChecked: React.AriaAttributes['aria-checked'];
    if (!canBeSelected) {
      ariaChecked = undefined;
    } else if (selectionStatus === 'checked') {
      ariaChecked = true;
    } else if (selectionStatus === 'indeterminate') {
      ariaChecked = 'mixed';
    } else {
      ariaChecked = false;
    }

    // Compute set size and position
    const parentKey = meta.parentId ?? TREE_VIEW_ROOT_PARENT_ID;
    const siblings = childrenLookup[parentKey] ?? [];
    const posInSet = (indexesLookup[parentKey]?.[itemId] ?? 0) + 1;

    // Compute tabindex
    const isDefaultFocusable =
      currentFocusedId != null ? currentFocusedId === itemId : defaultFocusableId === itemId;

    return {
      'aria-expanded': meta.expandable ? expanded : undefined,
      'aria-selected': canBeSelected ? selectionStatus === 'checked' : undefined,
      'aria-checked': ariaChecked,
      'aria-level': meta.depth + 1,
      'aria-setsize': siblings.length,
      'aria-posinset': posInSet,
      'aria-disabled': disabled || undefined,
      tabIndex: isDefaultFocusable ? 0 : -1,
      state: {
        itemId,
        expanded,
        expandable: meta.expandable,
        selected: selectionStatus === 'checked',
        focused,
        disabled,
        editing,
        depth: meta.depth,
      },
    };
  },
);

/**
 * Tree.CheckboxItem / Tree.CheckboxItemIndicator — returns checkbox state.
 */
export const checkboxProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => checkboxSelectionStatus(state, itemId),
  (state: TreeState, itemId: TreeItemId) => canItemBeSelected(state, itemId),
  (state: TreeState, itemId: TreeItemId): boolean => {
    if (state.selectionMode === 'none') {
      return true;
    }
    const meta = state.itemMetaLookup[itemId];
    return meta != null && !meta.selectable;
  },
  (selectionStatus, canBeSelected, hidden, _itemId: TreeItemId) => ({
    checked: selectionStatus === 'checked',
    indeterminate: selectionStatus === 'indeterminate',
    disabled: !canBeSelected,
    hidden,
  }),
);

/**
 * Tree.ItemLabel — returns label state.
 */
export const labelProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => state.itemMetaLookup[itemId]?.label ?? '',
  (state: TreeState, itemId: TreeItemId) => state.editedItemId === itemId,
  (label, editing, _itemId: TreeItemId) => ({
    label,
    editing,
  }),
);

/**
 * Tree.ItemExpansionTrigger — returns expansion trigger state.
 */
export const expansionTriggerProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => state.itemMetaLookup[itemId],
  (state: TreeState, itemId: TreeItemId) => isItemExpanded(state, itemId),
  (meta, expanded, _itemId: TreeItemId) => ({
    expanded,
    expandable: meta?.expandable ?? false,
  }),
);

/**
 * Tree.ItemGroupIndicator — returns group indicator state.
 */
export const groupIndicatorProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => state.itemMetaLookup[itemId],
  (state: TreeState, itemId: TreeItemId) => isItemExpanded(state, itemId),
  (meta, expanded, _itemId: TreeItemId) => ({
    expanded,
    expandable: meta?.expandable ?? false,
  }),
);

/**
 * Tree.ItemLoadingIndicator — returns loading state.
 */
export const loadingIndicatorProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => state.lazyLoadedItems?.loading[itemId] ?? false,
  (loading, _itemId: TreeItemId) => ({
    loading,
  }),
);

/**
 * Tree.ItemErrorIndicator — returns error state.
 */
export const errorIndicatorProps = createSelectorMemoized(
  (state: TreeState, itemId: TreeItemId) => state.lazyLoadedItems?.errors[itemId],
  (error, _itemId: TreeItemId) => ({
    error,
    hasError: error != null,
  }),
);

// =============================================================================
// Aggregated selectors object for use with ReactStore
// =============================================================================

export const selectors = {
  // Internal
  itemMetaLookup,
  itemMeta,
  itemModel,
  itemOrderedChildrenIds,
  itemIndex,
  itemParentId,
  itemDepth,
  isItemDisabled,
  canItemBeFocused,
  isItemExpanded,
  isItemExpandable,
  flatList,
  isItemSelected,
  isMultiSelectEnabled,
  isSelectionDisabled,
  canItemBeSelected,
  checkboxSelectionStatus,
  selectionPropagationRules,
  focusedItemId,
  isItemFocused,
  defaultFocusableItemId,
  isItemBeingEdited,
  editedItemId,
  isItemLoading,
  itemError,
  // Composite (one per part)
  itemProps,
  checkboxProps,
  labelProps,
  expansionTriggerProps,
  groupIndicatorProps,
  loadingIndicatorProps,
  errorIndicatorProps,
};
