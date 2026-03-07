import type { TreeState, TreeItemId, TreeItemMeta } from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';

function canItemBeFocused(state: TreeState, itemId: TreeItemId): boolean {
  const meta = state.itemMetaLookup[itemId];
  if (!meta) {
    return false;
  }
  return state.disabledItemsFocusable || !isItemDisabledInternal(state, itemId);
}

function isItemDisabledInternal(state: TreeState, itemId: TreeItemId): boolean {
  const meta = state.itemMetaLookup[itemId];
  if (!meta) {
    return false;
  }
  if (meta.disabled) {
    return true;
  }
  if (meta.parentId != null) {
    return isItemDisabledInternal(state, meta.parentId);
  }
  return false;
}

function isItemExpanded(state: TreeState, itemId: TreeItemId): boolean {
  return state.expandedItems.indexOf(itemId) !== -1;
}

function isItemExpandable(state: TreeState, itemId: TreeItemId): boolean {
  return state.itemMetaLookup[itemId]?.expandable ?? false;
}

function itemOrderedChildrenIds(state: TreeState, itemId: TreeItemId | null): TreeItemId[] {
  return state.itemOrderedChildrenIdsLookup[itemId ?? TREE_VIEW_ROOT_PARENT_ID] ?? [];
}

function itemIndex(state: TreeState, itemId: TreeItemId): number {
  const meta = state.itemMetaLookup[itemId];
  if (!meta) {
    return -1;
  }
  return state.itemChildrenIndexesLookup[meta.parentId ?? TREE_VIEW_ROOT_PARENT_ID]?.[itemId] ?? -1;
}

function itemMeta(state: TreeState, itemId: TreeItemId | null): TreeItemMeta | null {
  if (itemId == null) {
    return null;
  }
  return state.itemMetaLookup[itemId] ?? null;
}

function itemParentId(state: TreeState, itemId: TreeItemId): TreeItemId | null {
  return state.itemMetaLookup[itemId]?.parentId ?? null;
}

const getLastNavigableItemInArray = (state: TreeState, items: TreeItemId[]) => {
  let idx = items.length - 1;
  while (idx >= 0 && !canItemBeFocused(state, items[idx])) {
    idx -= 1;
  }

  if (idx === -1) {
    return undefined;
  }

  return items[idx];
};

export const getPreviousNavigableItem = (
  state: TreeState,
  itemId: TreeItemId,
): TreeItemId | null => {
  const meta = itemMeta(state, itemId);
  if (!meta) {
    return null;
  }

  const siblings = itemOrderedChildrenIds(state, meta.parentId);
  const currentIndex = itemIndex(state, itemId);

  if (currentIndex === 0) {
    return meta.parentId;
  }

  // Find the previous navigable sibling.
  let previousNavigableSiblingIndex = currentIndex - 1;
  while (
    !canItemBeFocused(state, siblings[previousNavigableSiblingIndex]) &&
    previousNavigableSiblingIndex >= 0
  ) {
    previousNavigableSiblingIndex -= 1;
  }

  if (previousNavigableSiblingIndex === -1) {
    if (meta.parentId == null) {
      return null;
    }

    return getPreviousNavigableItem(state, meta.parentId);
  }

  // Find the last navigable descendant of the previous navigable sibling.
  let currentItemId: TreeItemId = siblings[previousNavigableSiblingIndex];
  let lastNavigableChild = getLastNavigableItemInArray(
    state,
    itemOrderedChildrenIds(state, currentItemId),
  );
  while (isItemExpanded(state, currentItemId) && lastNavigableChild != null) {
    currentItemId = lastNavigableChild;
    lastNavigableChild = getLastNavigableItemInArray(
      state,
      itemOrderedChildrenIds(state, currentItemId),
    );
  }

  return currentItemId;
};

export const getNextNavigableItem = (state: TreeState, itemId: TreeItemId): TreeItemId | null => {
  // If the item is expanded and has some navigable children, return the first of them.
  if (isItemExpanded(state, itemId)) {
    const firstNavigableChild = itemOrderedChildrenIds(state, itemId).find((childId) =>
      canItemBeFocused(state, childId),
    );
    if (firstNavigableChild != null) {
      return firstNavigableChild;
    }
  }

  let currentMeta = itemMeta(state, itemId);
  while (currentMeta != null) {
    const siblings = itemOrderedChildrenIds(state, currentMeta.parentId);
    const currentItemIndex = itemIndex(state, currentMeta.id);

    if (currentItemIndex < siblings.length - 1) {
      let nextItemIndex = currentItemIndex + 1;
      while (
        !canItemBeFocused(state, siblings[nextItemIndex]) &&
        nextItemIndex < siblings.length - 1
      ) {
        nextItemIndex += 1;
      }

      if (canItemBeFocused(state, siblings[nextItemIndex])) {
        return siblings[nextItemIndex];
      }
    }

    currentMeta = itemMeta(state, currentMeta.parentId);
  }

  return null;
};

export const getLastNavigableItem = (state: TreeState): TreeItemId | null => {
  let currentItemId: TreeItemId | null = null;
  while (currentItemId == null || isItemExpanded(state, currentItemId)) {
    const children = itemOrderedChildrenIds(state, currentItemId);
    const lastNavigableChild = getLastNavigableItemInArray(state, children);

    if (lastNavigableChild == null) {
      return currentItemId;
    }

    currentItemId = lastNavigableChild;
  }

  return currentItemId;
};

export const getFirstNavigableItem = (state: TreeState): TreeItemId | null =>
  itemOrderedChildrenIds(state, null).find((id) => canItemBeFocused(state, id)) ?? null;

/**
 * Determines the order of two items in the tree using the Tremaux tree algorithm.
 * Returns [first, second] based on depth-first order.
 */
export const findOrderInTremauxTree = (
  state: TreeState,
  itemAId: TreeItemId,
  itemBId: TreeItemId,
): [TreeItemId, TreeItemId] => {
  if (itemAId === itemBId) {
    return [itemAId, itemBId];
  }

  const metaA = itemMeta(state, itemAId);
  const metaB = itemMeta(state, itemBId);

  if (!metaA || !metaB) {
    return [itemAId, itemBId];
  }

  if (metaA.parentId === metaB.id || metaB.parentId === metaA.id) {
    return metaB.parentId === metaA.id ? [metaA.id, metaB.id] : [metaB.id, metaA.id];
  }

  const aFamily: (TreeItemId | null)[] = [metaA.id];
  const bFamily: (TreeItemId | null)[] = [metaB.id];

  let aAncestor: TreeItemId | null = metaA.parentId;
  let bAncestor: TreeItemId | null = metaB.parentId;

  let aAncestorIsCommon = bFamily.indexOf(aAncestor) !== -1;
  let bAncestorIsCommon = aFamily.indexOf(bAncestor) !== -1;

  let continueA = true;
  let continueB = true;

  while (!bAncestorIsCommon && !aAncestorIsCommon) {
    if (continueA) {
      aFamily.push(aAncestor);
      aAncestorIsCommon = bFamily.indexOf(aAncestor) !== -1;
      continueA = aAncestor !== null;
      if (!aAncestorIsCommon && continueA) {
        aAncestor = itemParentId(state, aAncestor!);
      }
    }

    if (continueB && !aAncestorIsCommon) {
      bFamily.push(bAncestor);
      bAncestorIsCommon = aFamily.indexOf(bAncestor) !== -1;
      continueB = bAncestor !== null;
      if (!bAncestorIsCommon && continueB) {
        bAncestor = itemParentId(state, bAncestor!);
      }
    }
  }

  const commonAncestor = aAncestorIsCommon ? aAncestor : bAncestor;
  const ancestorFamily = itemOrderedChildrenIds(state, commonAncestor);

  const aSide = aFamily[aFamily.indexOf(commonAncestor) - 1]!;
  const bSide = bFamily[bFamily.indexOf(commonAncestor) - 1]!;

  return ancestorFamily.indexOf(aSide) < ancestorFamily.indexOf(bSide)
    ? [itemAId, itemBId]
    : [itemBId, itemAId];
};

/**
 * Returns non-disabled items between two items in the tree.
 */
export const getNonDisabledItemsInRange = (
  state: TreeState,
  itemAId: TreeItemId,
  itemBId: TreeItemId,
): TreeItemId[] => {
  const getNextItem = (id: TreeItemId): TreeItemId => {
    if (isItemExpandable(state, id) && isItemExpanded(state, id)) {
      return itemOrderedChildrenIds(state, id)[0];
    }

    let currentMeta: TreeItemMeta | null = itemMeta(state, id);
    while (currentMeta != null) {
      const siblings = itemOrderedChildrenIds(state, currentMeta.parentId);
      const currentItemIndex = itemIndex(state, currentMeta.id);

      if (currentItemIndex < siblings.length - 1) {
        return siblings[currentItemIndex + 1];
      }

      currentMeta = currentMeta.parentId ? itemMeta(state, currentMeta.parentId) : null;
    }

    throw new Error(
      'Base UI: Invalid range - unable to find a path between the two items. ' +
        'This may occur if the items are not in the same tree or the tree structure is invalid. ' +
        'Verify that both items exist in the tree.',
    );
  };

  const [first, last] = findOrderInTremauxTree(state, itemAId, itemBId);
  const items = [first];
  let current = first;

  while (current !== last) {
    current = getNextItem(current);
    if (!isItemDisabledInternal(state, current)) {
      items.push(current);
    }
  }

  return items;
};

/**
 * Returns all navigable items in tree order.
 */
export const getAllNavigableItems = (state: TreeState): TreeItemId[] => {
  let item: TreeItemId | null = getFirstNavigableItem(state);
  const navigableItems: TreeItemId[] = [];
  while (item != null) {
    navigableItems.push(item);
    item = getNextNavigableItem(state, item);
  }

  return navigableItems;
};
