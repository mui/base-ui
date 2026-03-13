import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type {
  TreeState,
  TreeItemId,
  TreeItemMeta,
  TreeDefaultItemModel,
  TreeItemsState,
  FlatListEntry,
} from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';
import { buildItemsState } from './buildItemsState';

/**
 * Intermediate selector: bundles all accessor functions into a single memoized object.
 * This avoids exceeding the max arity of createSelectorMemoized (5 inputs + combiner).
 */
const itemAccessorsSelector = createSelectorMemoized(
  (state: TreeState) => state.itemToId,
  (state: TreeState) => state.itemToStringLabel,
  (state: TreeState) => state.itemToChildren,
  (state: TreeState) => state.isItemDisabled,
  (state: TreeState) => state.isItemSelectionDisabled,
  (itemToId, itemToStringLabel, itemToChildren, isItemDisabled, isItemSelectionDisabled) => ({
    itemToId,
    itemToStringLabel,
    itemToChildren,
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
      acc.itemToId,
      acc.itemToStringLabel,
      acc.itemToChildren,
      acc.isItemDisabled,
      acc.isItemSelectionDisabled,
    ),
);

/**
 * Merges all overrides (lazy items + meta patches) into the raw items state in a single pass.
 * When no overrides exist, returns the raw state as-is (zero overhead).
 */
const resolvedItemsStateSelector = createSelectorMemoized(
  rawItemsStateSelector,
  (state: TreeState) => state.lazyItems,
  (state: TreeState) => state.itemMetaPatches,
  itemAccessorsSelector,
  (raw, lazyItems, metaPatches, acc): TreeItemsState => {
    const hasLazyChildren = Object.keys(lazyItems.children).length > 0;
    const hasLazyExpandable = Object.keys(lazyItems.expandable).length > 0;
    const hasPatches = Object.keys(metaPatches).length > 0;

    if (!hasLazyChildren && !hasLazyExpandable && !hasPatches) {
      return raw;
    }

    const metaLookup = { ...raw.itemMetaLookup };
    const modelLookup = { ...raw.itemModelLookup };
    const childrenIdsLookup = { ...raw.itemOrderedChildrenIdsLookup };
    const childrenIndexesLookup = { ...raw.itemChildrenIndexesLookup };

    // Phase 1: Apply lazy-loaded children (tree structure mutations)
    if (hasLazyChildren) {
      const processChildren = (
        children: TreeDefaultItemModel[],
        parentId: string,
        parentDepth: number,
      ) => {
        const ids: TreeItemId[] = [];
        const indexes: Record<TreeItemId, number> = {};

        for (let i = 0; i < children.length; i += 1) {
          const child = children[i];
          const childId = acc.itemToId(child);
          const depth = parentDepth + 1;

          ids.push(childId);
          indexes[childId] = i;

          modelLookup[childId] = child;
          metaLookup[childId] = {
            id: childId,
            parentId: parentId === TREE_VIEW_ROOT_PARENT_ID ? null : parentId,
            depth,
            expandable: lazyItems.expandable[childId] ?? false,
            disabled: acc.isItemDisabled(child),
            selectable: !acc.isItemSelectionDisabled(child),
            label: acc.itemToStringLabel(child),
          };

          // Process inline children of fetched items
          const grandchildren = acc.itemToChildren(child);
          if (grandchildren && grandchildren.length > 0) {
            processChildren(grandchildren, childId, depth);
            metaLookup[childId] = { ...metaLookup[childId], expandable: true };
          }
        }

        childrenIdsLookup[parentId] = ids;
        childrenIndexesLookup[parentId] = indexes;
      };

      for (const [parentId, children] of Object.entries(lazyItems.children)) {
        const parentMeta = metaLookup[parentId];
        const parentDepth = parentMeta ? parentMeta.depth : -1;
        processChildren(children, parentId, parentDepth);
      }
    }

    // Phase 2: Apply expandable overrides (for items not yet in lazyItems.children)
    if (hasLazyExpandable) {
      for (const [id, expandable] of Object.entries(lazyItems.expandable)) {
        if (metaLookup[id] && metaLookup[id].expandable !== expandable) {
          metaLookup[id] = { ...metaLookup[id], expandable };
        }
      }
    }

    // Phase 3: Apply meta patches (disabled)
    if (hasPatches) {
      for (const [id, patch] of Object.entries(metaPatches)) {
        if (metaLookup[id]) {
          metaLookup[id] = { ...metaLookup[id], ...patch };
        }
      }
    }

    return {
      itemMetaLookup: metaLookup,
      itemModelLookup: modelLookup,
      itemOrderedChildrenIdsLookup: childrenIdsLookup,
      itemChildrenIndexesLookup: childrenIndexesLookup,
    };
  },
);

const itemMetaLookupSelector = createSelector(
  (state: TreeState) => resolvedItemsStateSelector(state).itemMetaLookup,
);

const itemModelLookupSelector = createSelector(
  (state: TreeState) => resolvedItemsStateSelector(state).itemModelLookup,
);

const itemOrderedChildrenIdsLookupSelector = createSelector(
  (state: TreeState) => resolvedItemsStateSelector(state).itemOrderedChildrenIdsLookup,
);

const itemChildrenIndexesLookupSelector = createSelector(
  (state: TreeState) => resolvedItemsStateSelector(state).itemChildrenIndexesLookup,
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

/**
 * Precomputes {selected, total} descendant counts for every item in a single
 * O(N) bottom-up traversal. Memoized so it only recomputes when selectedItems
 * or tree structure changes.
 */
const descendantSelectionCountsSelector = createSelectorMemoized(
  selectedItemsSetSelector,
  itemOrderedChildrenIdsLookupSelector,
  (selectedSet, childrenLookup): Record<TreeItemId, { selected: number; total: number }> => {
    const counts: Record<TreeItemId, { selected: number; total: number }> = {};

    const compute = (itemId: string): { selected: number; total: number } => {
      const children = childrenLookup[itemId];
      if (!children || children.length === 0) {
        const result = { selected: 0, total: 0 };
        counts[itemId] = result;
        return result;
      }

      let selected = 0;
      let total = 0;

      for (const childId of children) {
        total += 1;
        if (selectedSet.has(childId)) {
          selected += 1;
        }
        const childCounts = compute(childId);
        selected += childCounts.selected;
        total += childCounts.total;
      }

      const result = { selected, total };
      counts[itemId] = result;
      return result;
    };

    compute(TREE_VIEW_ROOT_PARENT_ID);
    return counts;
  },
);

const checkboxSelectionStatusSelector = createSelector(
  (state: TreeState, itemId: TreeItemId): CheckboxSelectionStatus => {
    if (isItemSelectedSelector(state, itemId)) {
      return 'checked';
    }

    const counts = descendantSelectionCountsSelector(state)[itemId];
    if (!counts || counts.total === 0) {
      return 'empty';
    }

    const hasSelectedDescendant = counts.selected > 0;
    const hasUnSelectedDescendant = counts.selected < counts.total;

    if (state.checkboxSelectionPropagation.parents) {
      if (hasSelectedDescendant && hasUnSelectedDescendant) {
        return 'indeterminate';
      }
      if (hasSelectedDescendant) {
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

const flatListSelector = createSelectorMemoized(
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
);

const flatListWithGroupTransitionsSelector = createSelectorMemoized(
  flatListSelector,
  (state: TreeState) => state.animatingGroups,
  (flatList, animatingGroups): FlatListEntry[] => {
    const animatingGroupKeys = Object.keys(animatingGroups);
    if (animatingGroupKeys.length === 0) {
      return flatList.map((itemId) => ({ type: 'item' as const, itemId }));
    }

    // Build a set of all childIds currently being animated
    const animatingChildIds = new Set<TreeItemId>();
    // Map childId -> parentId for items in expanding groups
    const childToAnimatingParent = new Map<TreeItemId, TreeItemId>();
    for (const parentId of animatingGroupKeys) {
      const group = animatingGroups[parentId];
      for (const childId of group.childIds) {
        animatingChildIds.add(childId);
        childToAnimatingParent.set(childId, parentId);
      }
    }

    const result: FlatListEntry[] = [];
    const insertedGroups = new Set<TreeItemId>();

    for (const itemId of flatList) {
      // If this item is inside an expanding animation group, skip it
      // (it will be rendered inside the group-transition wrapper)
      if (animatingChildIds.has(itemId)) {
        const parentId = childToAnimatingParent.get(itemId)!;
        if (!insertedGroups.has(parentId)) {
          insertedGroups.add(parentId);
          const group = animatingGroups[parentId];
          result.push({
            type: 'group-transition',
            parentId,
            childIds: group.childIds,
            animation: group.type,
          });
        }
        continue;
      }

      result.push({ type: 'item', itemId });

      // After a parent item, inject any collapsing group
      // (its children are no longer in flatList since expandedItems was already updated)
      const collapsingGroup = animatingGroups[itemId];
      if (collapsingGroup?.type === 'collapsing' && !insertedGroups.has(itemId)) {
        insertedGroups.add(itemId);
        result.push({
          type: 'group-transition',
          parentId: itemId,
          childIds: collapsingGroup.childIds,
          animation: 'collapsing',
        });
      }
    }

    return result;
  },
);

const visibleItemsSelector = createSelectorMemoized(
  flatListSelector,
  itemMetaLookupSelector,
  (flatList, metaLookup): VisibleItem[] =>
    flatList.map((itemId) => ({
      itemId,
      depth: metaLookup[itemId]?.depth ?? 0,
    })),
);

export interface VisibleItem {
  itemId: TreeItemId;
  depth: number;
}

export const selectors = {
  virtualized: createSelector((state: TreeState): boolean => state.virtualized),
  visibleItems: visibleItemsSelector,
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
  flatList: flatListSelector,
  flatListWithGroupTransitions: flatListWithGroupTransitionsSelector,
  isItemSelected: isItemSelectedSelector,
  isMultiSelectEnabled: createSelector(
    (state: TreeState): boolean => state.selectionMode === 'multiple',
  ),
  isSelectionDisabled: isSelectionDisabledSelector,
  canItemBeSelected: canItemBeSelectedSelector,
  checkboxSelectionStatus: checkboxSelectionStatusSelector,
  checkboxSelectionPropagationRules: createSelector(
    (state: TreeState) => state.checkboxSelectionPropagation,
  ),
  focusedItemId: createSelector((state: TreeState): TreeItemId | null => state.focusedItemId),
  isItemFocused: isItemFocusedSelector,
  defaultFocusableItemId: defaultFocusableItemIdSelector,
  isItemLoading: createSelector(
    (state: TreeState, itemId: TreeItemId | null): boolean =>
      state.lazyLoadedItems?.loading[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? false,
  ),
  itemError: createSelector(
    (state: TreeState, itemId: TreeItemId | null): Error | undefined =>
      state.lazyLoadedItems?.errors[itemId ?? TREE_VIEW_ROOT_PARENT_ID],
  ),
  isItemDefaultFocusable: isItemDefaultFocusableSelector,
  itemSiblingsCount: itemSiblingsCountSelector,
  itemPositionInSet: itemPositionInSetSelector,
  itemLabel: createSelector(
    (state: TreeState, itemId: TreeItemId): string =>
      itemMetaLookupSelector(state)[itemId]?.label ?? '',
  ),
};
