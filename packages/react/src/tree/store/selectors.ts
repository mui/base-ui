import { createSelectorMemoized } from '@base-ui/utils/store';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import type {
  TreeAnimatingGroup,
  TreeItemId,
  TreeState,
  FlatListEntry,
  TreeItemMeta,
  TreeItemKeyed,
  TreeParentKeyed,
  TreeView,
} from './types';

import { TREE_VIEW_ROOT_PARENT_ID, TREE_SELECTION_ALL } from './types';
import { buildChildrenIndexes, createLookup, getChildrenIndexes } from '../utils/lookup';
import { getItemIdKey, getParentKey } from '../utils/itemIdKey';
import { forEachDescendant, getVisibleDescendants } from '../utils/forEachDescendant';

export const EMPTY_SET: ReadonlySet<never> = new Set<never>();

/** The normalized collection is the single source of item accessors. */
const itemAccessorsSelector = (state: TreeState) => state.itemCollection;
/** Controlled `items` always publish a prop (an unloaded collection yields an empty array). */
const isItemsControlledSelector = (state: TreeState): boolean => state.itemsProp !== undefined;
const itemsConfigurationSelector = createSelectorMemoized(
  (state: TreeState) => state.itemsProp,
  itemAccessorsSelector,
  (itemsProp, itemCollection) => ({ itemsProp, itemCollection }),
);

/**
 * All lookup selectors read directly from state.
 * Lookups are initialized by buildItemsState() and updated incrementally by mutations.
 */
export const itemMetaLookupSelector = (state: TreeState) => state.itemMetaLookup;

const itemModelLookupSelector = (state: TreeState) => state.itemModelLookup;

const itemOrderedChildrenIdsLookupSelector = (state: TreeState) =>
  state.itemOrderedChildrenIdsLookup;

const itemOrderedChildrenIdsSelector = (
  state: TreeState,
  itemId: TreeItemId | null,
): TreeItemId[] => itemOrderedChildrenIdsLookupSelector(state)[getParentKey(itemId)] ?? EMPTY_ARRAY;

const isItemDisabledSelector = (state: TreeState, itemId: TreeItemId): boolean => {
  if (state.disabled) {
    return true;
  }
  const meta = itemMetaLookupSelector(state)[getItemIdKey(itemId)];
  return meta?.resolvedDisabled ?? false;
};

const expandedItemsSetSelector = createSelectorMemoized(
  (state: TreeState) => state.expandedItems,
  (expandedItems): Set<TreeItemId> => new Set(expandedItems),
);

const canonicalViewSelector = createSelectorMemoized(
  itemOrderedChildrenIdsLookupSelector,
  expandedItemsSetSelector,
  (childrenLookup, expandedItems): TreeView => ({
    childrenLookup,
    expandedItems,
    transformed: false,
  }),
);

// Row-level selectors read the view several times per row on every store
// notification. Caching it per state object skips re-running each transform's
// memoization checks after the first read; states are immutable, so the cache
// cannot go stale.
const viewCache = new WeakMap<TreeState, TreeView>();

/** The hierarchy as presented: the canonical lookups passed through the installed view transform. */
function viewSelector(state: TreeState): TreeView {
  const { viewTransform } = state;
  if (viewTransform === undefined) {
    return canonicalViewSelector(state);
  }
  let view = viewCache.get(state);
  if (view === undefined) {
    view = viewTransform(state, canonicalViewSelector(state));
    viewCache.set(state, view);
  }
  return view;
}

export const effectiveExpandedItemsSetSelector = (state: TreeState): ReadonlySet<TreeItemId> =>
  viewSelector(state).expandedItems;

export const projectedChildrenLookupSelector = (state: TreeState) =>
  viewSelector(state).childrenLookup;

const projectedItemOrderedChildrenIdsSelector = (
  state: TreeState,
  itemId: TreeItemId | null,
): TreeItemId[] => projectedChildrenLookupSelector(state)[getParentKey(itemId)] ?? EMPTY_ARRAY;

/** The index of an item among its siblings in a children lookup, or `-1`. */
function getSiblingIndex(
  childrenLookup: TreeParentKeyed<readonly TreeItemId[]>,
  meta: TreeItemMeta | undefined,
): number {
  if (meta == null) {
    return -1;
  }
  const siblings = childrenLookup[getParentKey(meta.parentId)];
  return siblings == null ? -1 : (getChildrenIndexes(siblings)[getItemIdKey(meta.id)] ?? -1);
}

const projectedItemIndexSelector = (state: TreeState, itemId: TreeItemId): number =>
  getSiblingIndex(
    projectedChildrenLookupSelector(state),
    itemMetaLookupSelector(state)[getItemIdKey(itemId)],
  );

const isItemExpandedSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  effectiveExpandedItemsSetSelector(state).has(itemId);

/**
 * Converts a raw selectedItems value to a plain array.
 * Does NOT handle the "all" sentinel — use `materializeSelectedItems()` for that.
 */
export function normalizeSelectedItems(
  raw: TreeItemId | null | readonly TreeItemId[],
): TreeItemId[] {
  if (Array.isArray(raw)) {
    return raw as TreeItemId[];
  }
  if (raw != null) {
    return [raw as TreeItemId];
  }
  return [];
}

const selectedItemsSetSelector = createSelectorMemoized(
  (state: TreeState) => state.selectedItems,
  (raw): Set<TreeItemId> | typeof TREE_SELECTION_ALL =>
    raw === TREE_SELECTION_ALL ? raw : new Set(normalizeSelectedItems(raw)),
);

/**
 * Whether the item *supports* selection at all, disabled or not.
 *
 * Distinct from {@link canItemBeSelectedSelector}, which also answers whether it
 * can be selected right now. WAI-ARIA requires every focusable row in a treegrid
 * that supports selection to carry `aria-selected`, including a disabled row (and
 * every row while the whole tree is disabled) — a selected row that goes disabled
 * must keep announcing that it is selected.
 */
const isItemSelectionSupportedSelector = (state: TreeState, itemId: TreeItemId): boolean => {
  if (state.selectionMode === 'none') {
    return false;
  }
  return itemMetaLookupSelector(state)[getItemIdKey(itemId)]?.selectable ?? false;
};

const canItemBeSelectedSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  isItemSelectionSupportedSelector(state, itemId) && !isItemDisabledSelector(state, itemId);

/**
 * Whether `TREE_SELECTION_ALL` selects the item: it supports selection and is not
 * disabled on its own or through an ancestor. The tree-wide `disabled` state and
 * `selectionMode="none"` only pause interaction, so they keep the selection as is.
 */
function isMetaInSelectionAll(meta: TreeItemMeta | undefined): boolean {
  return meta != null && meta.selectable && !meta.resolvedDisabled;
}

const isItemInSelectionAllSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  isMetaInSelectionAll(itemMetaLookupSelector(state)[getItemIdKey(itemId)]);

/** The items `TREE_SELECTION_ALL` selects, in tree order. */
const selectionAllItemIdsSelector = createSelectorMemoized(
  itemOrderedChildrenIdsLookupSelector,
  itemMetaLookupSelector,
  (childrenLookup, metaLookup): readonly TreeItemId[] => {
    const result: TreeItemId[] = [];
    forEachDescendant(childrenLookup, null, (itemId) => {
      if (isMetaInSelectionAll(metaLookup[getItemIdKey(itemId)])) {
        result.push(itemId);
      }
    });
    return result;
  },
);

const isItemSelectedSelector = (state: TreeState, itemId: TreeItemId): boolean => {
  const selectedSet = selectedItemsSetSelector(state);
  if (selectedSet === TREE_SELECTION_ALL) {
    return isItemInSelectionAllSelector(state, itemId);
  }
  return (
    selectedSet.has(itemId) &&
    (itemMetaLookupSelector(state)[getItemIdKey(itemId)]?.selectable ?? false)
  );
};

export type CheckboxSelectionStatus = 'checked' | 'indeterminate' | 'empty';

/**
 * Selectable descendant totals only change with tree structure or disabled state.
 * A disabled tree keeps them, so its checkboxes still show the selection.
 */
const selectableDescendantCountsSelector = createSelectorMemoized(
  itemOrderedChildrenIdsLookupSelector,
  itemMetaLookupSelector,
  (state: TreeState) => state.selectionMode,
  (childrenLookup, metaLookup, selectionMode): TreeParentKeyed<number> => {
    if (selectionMode === 'none') {
      return {};
    }
    const order: TreeItemId[] = [];
    forEachDescendant(childrenLookup, null, (itemId) => {
      order.push(itemId);
    });
    // Backwards through the preorder, every subtree is totaled before its parent reads it.
    const descendantCounts: TreeParentKeyed<number> = createLookup();
    for (let index = order.length - 1; index >= 0; index -= 1) {
      const key = getItemIdKey(order[index]);
      const meta = metaLookup[key];
      if (meta != null) {
        const parentKey = getParentKey(meta.parentId);
        descendantCounts[parentKey] =
          (descendantCounts[parentKey] ?? 0) +
          (descendantCounts[key] ?? 0) +
          (isMetaInSelectionAll(meta) ? 1 : 0);
      }
    }
    return descendantCounts;
  },
);

/** Aggregate the union of selected ancestor paths so shared paths are walked once. */
const selectedDescendantCountsSelector = createSelectorMemoized(
  selectedItemsSetSelector,
  itemMetaLookupSelector,
  (selectedSet, metaLookup): TreeParentKeyed<number> | null => {
    if (selectedSet === TREE_SELECTION_ALL) {
      return null;
    }
    const counts: TreeParentKeyed<number> = createLookup();
    const paths = new Map<
      TreeItemId,
      { parentId: TreeItemId | null; selected: number; children: number; total: number }
    >();
    for (const itemId of selectedSet) {
      if (!isMetaInSelectionAll(metaLookup[getItemIdKey(itemId)])) {
        continue;
      }
      let id: TreeItemId | null = itemId;
      while (id != null && !paths.has(id)) {
        const parentId: TreeItemId | null = metaLookup[getItemIdKey(id)]?.parentId ?? null;
        paths.set(id, { parentId, selected: 0, children: 0, total: 0 });
        id = parentId;
      }
      paths.get(itemId)!.selected = 1;
    }
    for (const entry of paths.values()) {
      if (entry.parentId != null) {
        paths.get(entry.parentId)!.children += 1;
      }
    }
    const pending: TreeItemId[] = [];
    for (const [id, entry] of paths) {
      if (entry.children === 0) {
        pending.push(id);
      }
    }
    while (pending.length > 0) {
      const id = pending.pop()!;
      const entry = paths.get(id)!;
      counts[getItemIdKey(id)] = entry.total;
      if (entry.parentId != null) {
        const parent = paths.get(entry.parentId)!;
        parent.total += entry.total + entry.selected;
        parent.children -= 1;
        if (parent.children === 0) {
          pending.push(entry.parentId);
        }
      }
    }
    return counts;
  },
);

const checkboxSelectionStatusSelector = (
  state: TreeState,
  itemId: TreeItemId,
): CheckboxSelectionStatus => {
  if (isItemSelectedSelector(state, itemId)) {
    return 'checked';
  }

  const total = selectableDescendantCountsSelector(state)[getItemIdKey(itemId)] ?? 0;
  if (total === 0) {
    return 'empty';
  }

  const selectedCounts = selectedDescendantCountsSelector(state);
  const selected = selectedCounts == null ? total : (selectedCounts[getItemIdKey(itemId)] ?? 0);

  const hasSelectedDescendant = selected > 0;
  const hasUnSelectedDescendant = selected < total;

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
};

const isItemFocusedSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  state.focusedItemId === itemId;

/** Whether an item can take focus while the tree is or isn't disabled. */
function isMetaFocusable(
  meta: TreeItemMeta | undefined,
  treeDisabled: boolean,
  focusableWhenDisabled: boolean,
): meta is TreeItemMeta {
  return meta != null && (focusableWhenDisabled || !(treeDisabled || meta.resolvedDisabled));
}

const canItemBeFocusedSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  isMetaFocusable(
    itemMetaLookupSelector(state)[getItemIdKey(itemId)],
    state.disabled,
    state.itemFocusableWhenDisabled,
  );

/** Whether `parentId` and every ancestor above it are in `expandedSet`. */
export function areAncestorsExpanded(
  metaLookup: TreeItemKeyed<TreeItemMeta>,
  parentId: TreeItemId | null,
  expandedSet: ReadonlySet<TreeItemId>,
): boolean {
  for (let id = parentId; id != null; id = metaLookup[getItemIdKey(id)]?.parentId ?? null) {
    if (!expandedSet.has(id)) {
      return false;
    }
  }
  return true;
}

/**
 * Whether an item belongs to a view: kept by it, and with every ancestor
 * expanded. A transform keeps every ancestor of an item it keeps, so the item's
 * own sibling index tells.
 */
function isMetaInView(
  view: TreeView,
  metaLookup: TreeItemKeyed<TreeItemMeta>,
  meta: TreeItemMeta,
): boolean {
  return (
    (!view.transformed || getSiblingIndex(view.childrenLookup, meta) !== -1) &&
    areAncestorsExpanded(metaLookup, meta.parentId, view.expandedItems)
  );
}

/** Whether an item belongs to the current projected, effectively expanded view. */
const isItemVisibleSelector = (state: TreeState, itemId: TreeItemId): boolean => {
  const metaLookup = itemMetaLookupSelector(state);
  const meta = metaLookup[getItemIdKey(itemId)];
  return meta != null && isMetaInView(viewSelector(state), metaLookup, meta);
};

/** Whether focus can move to the item: it is visible and focusable. */
const isItemFocusTargetSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  isItemVisibleSelector(state, itemId) && canItemBeFocusedSelector(state, itemId);

export const flatListSelector = createSelectorMemoized(
  projectedChildrenLookupSelector,
  effectiveExpandedItemsSetSelector,
  (childrenLookup, expandedSet): TreeItemId[] =>
    getVisibleDescendants(childrenLookup, null, expandedSet),
);

const flatListIndexLookupSelector = createSelectorMemoized(flatListSelector, buildChildrenIndexes);

const defaultFocusableItemIdSelector = createSelectorMemoized(
  (state: TreeState) => state.selectedItems,
  (state: TreeState) => state.activeLinkCounts,
  viewSelector,
  itemMetaLookupSelector,
  (state: TreeState) => state.itemFocusableWhenDisabled,
  (state: TreeState) => state.disabled,
  (
    selectedItems,
    activeLinkCounts,
    view,
    metaLookup,
    disabledFocusable,
    treeDisabled,
  ): TreeItemId | null => {
    // A tree-wide `disabled` disables every item, so unless disabled items stay
    // focusable there is nothing to focus.
    if (treeDisabled && !disabledFocusable) {
      return null;
    }
    const isFocusable = (itemId: TreeItemId) =>
      isMetaFocusable(metaLookup[getItemIdKey(itemId)], treeDisabled, disabledFocusable);

    if (selectedItems !== TREE_SELECTION_ALL) {
      // Focus the first selected item whose ancestors are all expanded.
      for (const selectedId of normalizeSelectedItems(selectedItems)) {
        const meta = metaLookup[getItemIdKey(selectedId)];
        if (
          isMetaFocusable(meta, treeDisabled, disabledFocusable) &&
          isMetaInView(view, metaLookup, meta)
        ) {
          return selectedId;
        }
      }
    }

    // Then the row linking to the current page, as in the APG navigation tree view.
    for (const itemKey of Object.keys(activeLinkCounts)) {
      const meta = metaLookup[itemKey];
      if (
        isMetaFocusable(meta, treeDisabled, disabledFocusable) &&
        isMetaInView(view, metaLookup, meta)
      ) {
        return meta!.id;
      }
    }

    return (view.childrenLookup[TREE_VIEW_ROOT_PARENT_ID] ?? EMPTY_ARRAY).find(isFocusable) ?? null;
  },
);

/**
 * The item that carries the roving `tabIndex={0}`: the focused one, or the one
 * focused last when focus is outside the tree, while it is still focusable; else
 * the default.
 */
const focusedTabbableItemIdSelector = createSelectorMemoized(
  (state: TreeState) => state.focusedItemId ?? state.lastFocusedItemId,
  itemMetaLookupSelector,
  viewSelector,
  (state: TreeState) => state.itemFocusableWhenDisabled,
  (state: TreeState) => state.disabled,
  (focusedItemId, metaLookup, view, disabledFocusable, treeDisabled): TreeItemId | null => {
    if (focusedItemId == null) {
      return null;
    }
    const meta = metaLookup[getItemIdKey(focusedItemId)];
    return isMetaFocusable(meta, treeDisabled, disabledFocusable) &&
      isMetaInView(view, metaLookup, meta)
      ? focusedItemId
      : null;
  },
);

const tabbableItemIdSelector = (state: TreeState): TreeItemId | null =>
  focusedTabbableItemIdSelector(state) ?? defaultFocusableItemIdSelector(state);

const isItemDefaultFocusableSelector = (state: TreeState, itemId: TreeItemId): boolean =>
  tabbableItemIdSelector(state) === itemId;

const itemSiblingsCountSelector = (state: TreeState, itemId: TreeItemId): number => {
  const meta = itemMetaLookupSelector(state)[getItemIdKey(itemId)];
  return meta ? projectedItemOrderedChildrenIdsSelector(state, meta.parentId).length : 0;
};

const itemPositionInSetSelector = (state: TreeState, itemId: TreeItemId): number =>
  Math.max(projectedItemIndexSelector(state, itemId), 0) + 1;

const flatListWithGroupTransitionsSelector = createSelectorMemoized(
  flatListSelector,
  (state: TreeState) => state.animatingGroups,
  (state: TreeState) => viewSelector(state).transformed,
  (flatList, animatingGroups, viewTransformed): TreeItemId[] | FlatListEntry[] => {
    if (viewTransformed) {
      return flatList;
    }
    const animatingGroupValues = Object.values(animatingGroups);
    if (animatingGroupValues.length === 0) {
      return flatList;
    }

    const groupOfChild = new Map<TreeItemId, TreeAnimatingGroup>();
    for (const group of animatingGroupValues) {
      for (const childId of group.childIds) {
        groupOfChild.set(childId, group);
      }
    }

    const result: FlatListEntry[] = [];
    const insertedGroups = new Set<TreeItemId>();

    for (const itemId of flatList) {
      // If this item is inside an expanding animation group, skip it
      // (it will be rendered inside the group-transition wrapper)
      const group = groupOfChild.get(itemId);
      if (group != null) {
        if (!insertedGroups.has(group.parentId)) {
          insertedGroups.add(group.parentId);
          result.push({
            type: 'group-transition',
            parentId: group.parentId,
            childIds: group.childIds,
            animation: group.type,
          });
        }
        continue;
      }

      result.push({ type: 'item', itemId });

      // After a parent item, inject any collapsing group
      // (its children are no longer in flatList since expandedItems was already updated)
      const collapsingGroup = animatingGroups[getItemIdKey(itemId)];
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

const ancestorIdsSelector = (state: TreeState, itemId: TreeItemId): readonly TreeItemId[] => {
  const metaLookup = itemMetaLookupSelector(state);
  let current = metaLookup[getItemIdKey(itemId)]?.parentId ?? null;
  if (current == null) {
    return EMPTY_ARRAY;
  }
  const result: TreeItemId[] = [];
  while (current != null) {
    result.push(current);
    current = metaLookup[getItemIdKey(current)]?.parentId ?? null;
  }
  return result.reverse();
};

export const selectors = {
  itemsConfiguration: itemsConfigurationSelector,
  itemMetaLookup: itemMetaLookupSelector,
  itemMeta: (state: TreeState, itemId: TreeItemId | null): TreeItemMeta | null =>
    itemId == null ? null : (itemMetaLookupSelector(state)[getItemIdKey(itemId)] ?? null),
  itemModel: (state: TreeState, itemId: TreeItemId) =>
    itemModelLookupSelector(state)[getItemIdKey(itemId)],
  itemOrderedChildrenIds: itemOrderedChildrenIdsSelector,
  itemIndex: (state: TreeState, itemId: TreeItemId): number =>
    getSiblingIndex(
      itemOrderedChildrenIdsLookupSelector(state),
      itemMetaLookupSelector(state)[getItemIdKey(itemId)],
    ),
  itemParentId: (state: TreeState, itemId: TreeItemId): TreeItemId | null =>
    itemMetaLookupSelector(state)[getItemIdKey(itemId)]?.parentId ?? null,
  itemLevel: (state: TreeState, itemId: TreeItemId): number =>
    itemMetaLookupSelector(state)[getItemIdKey(itemId)]?.level ?? 1,
  isItemDisabled: isItemDisabledSelector,
  canItemBeFocused: canItemBeFocusedSelector,
  isItemExpanded: isItemExpandedSelector,
  isItemModelExpanded: (state: TreeState, itemId: TreeItemId): boolean =>
    expandedItemsSetSelector(state).has(itemId),
  isItemVisible: isItemVisibleSelector,
  isItemFocusTarget: isItemFocusTargetSelector,
  isItemExpandable: (state: TreeState, itemId: TreeItemId): boolean =>
    itemMetaLookupSelector(state)[getItemIdKey(itemId)]?.expandable ?? false,
  flatList: flatListSelector,
  /** The sibling after an item in the projected view, or `undefined` for the last one. */
  projectedNextSiblingId: (state: TreeState, itemId: TreeItemId): TreeItemId | undefined => {
    const index = projectedItemIndexSelector(state, itemId);
    return index === -1
      ? undefined
      : projectedItemOrderedChildrenIdsSelector(state, selectors.itemParentId(state, itemId))[
          index + 1
        ];
  },
  flatListIndex: (state: TreeState, itemId: TreeItemId): number =>
    flatListIndexLookupSelector(state)[getItemIdKey(itemId)] ?? -1,
  flatListWithGroupTransitions: flatListWithGroupTransitionsSelector,
  isViewTransformed: (state: TreeState): boolean => viewSelector(state).transformed,
  isItemSelected: isItemSelectedSelector,
  isItemInSelectionAll: isItemInSelectionAllSelector,
  selectionAllItemIds: selectionAllItemIdsSelector,
  canItemBeSelected: canItemBeSelectedSelector,
  isItemSelectionSupported: isItemSelectionSupportedSelector,
  checkboxSelectionStatus: checkboxSelectionStatusSelector,
  checkboxSelectionPropagation: (state: TreeState) => state.checkboxSelectionPropagation,
  focusedItemId: (state: TreeState): TreeItemId | null => state.focusedItemId,
  isItemFocused: isItemFocusedSelector,
  tabbableItemId: tabbableItemIdSelector,
  isItemDefaultFocusable: isItemDefaultFocusableSelector,
  itemSiblingsCount: itemSiblingsCountSelector,
  itemPositionInSet: itemPositionInSetSelector,
  itemLabel: (state: TreeState, itemId: TreeItemId): string =>
    itemMetaLookupSelector(state)[getItemIdKey(itemId)]?.label ?? '',
  expandedItemsSet: expandedItemsSetSelector,
  ancestorIds: ancestorIdsSelector,
  isItemsControlled: isItemsControlledSelector,
};
