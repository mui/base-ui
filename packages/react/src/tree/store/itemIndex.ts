import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { error } from '@base-ui/utils/error';
import type {
  TreeDefaultItem,
  TreeItemId,
  TreeItemKeyed,
  TreeItemMeta,
  TreeItemDestination,
  TreeItemChange,
  TreeItemsState,
  TreeParentKeyed,
  TreeState,
} from './types';
import type { TreeItemReaders } from '../items/itemCollection';
import { selectors } from './selectors';
import { cloneLookup, createLookup } from '../utils/lookup';
import { getItemIdKey, getParentKey } from '../utils/itemIdKey';
import { forEachDescendant } from '../utils/forEachDescendant';
import {
  collectAncestorIds,
  getIndexAfterRemoval,
  isInSubtreeOf,
  pruneDescendantIds,
} from '../utils/pruneDescendantIds';
import { sortIdsByTreeOrder } from '../utils/sortIdsByTreeOrder';
import { writeItemChildren } from '../utils/requireItemWriter';

/*
 * The item index: the items and the lookups derived from them. It is built
 * once from the items, then each edit derives the next items and lookups from
 * the current ones, with the same result as building them again.
 */

/** An items change: the next items, and how the index of the state it was made on changes. */
export interface TreeItemsEdit<TItem> {
  items: readonly TItem[];
  /** The lookups that differ from the ones of the state the edit was made on. */
  lookups: Partial<TreeItemsState<TItem>>;
  /** The changes, in the order they applied. */
  changes: TreeItemChange<TItem>[];
  /**
   * The removed items and their descendants. The transaction drops the ones it adds
   * back, and selection and expansion forget the others.
   */
  removedIds?: ReadonlySet<TreeItemId> | undefined;
}

/**
 * The lookups an edit of the transaction being applied copied, which its later
 * edits write in place instead of copying the whole lookup again. Outside a
 * transaction, every edit copies the lookups it changes.
 */
let draftLookups: WeakSet<object> | null = null;

/**
 * Applies the edits of a transaction, each writing into the lookups the previous
 * ones copied. The lookups `apply` returns must not be written once it returns.
 */
export function withDraftLookups<T>(apply: () => T): T {
  const previous = draftLookups;
  draftLookups = new WeakSet();
  try {
    return apply();
  } finally {
    draftLookups = previous;
  }
}

/** Copies a lookup for an edit to write into, unless the transaction already copied it. */
function copyLookup<T extends object>(lookup: T): T {
  if (draftLookups?.has(lookup)) {
    return lookup;
  }
  const copy = cloneLookup(lookup);
  draftLookups?.add(copy);
  return copy;
}

/**
 * Whether two children lookups hold the same children, in the same order, under
 * every parent. An edit can rebuild the children of an item without changing
 * them, such as a replacement model with a copy of its children.
 */
export function isSameHierarchy(
  a: TreeItemsState['itemOrderedChildrenIdsLookup'],
  b: TreeItemsState['itemOrderedChildrenIdsLookup'],
): boolean {
  if (a === b) {
    return true;
  }
  // The key of the root parent is a symbol.
  const keys = Reflect.ownKeys(b) as Array<keyof typeof b>;
  return (
    keys.length === Reflect.ownKeys(a).length &&
    keys.every((key) => {
      const previous = a[key];
      const next = b[key];
      return (
        previous === next || (previous != null && next != null && areArraysEqual(previous, next))
      );
    })
  );
}

/** Whether an item can be expanded: it has inline children. */
function deriveExpandable<TItem>(item: TItem, readers: TreeItemReaders<TItem>): boolean {
  return (readers.itemToChildren(item)?.length ?? 0) > 0;
}

/** Removes items, along with their descendants. */
export function getRemovalEdit<TItem>(
  state: TreeState<TItem>,
  itemIds: ReadonlySet<TreeItemId>,
): TreeItemsEdit<TItem> {
  const removalRoots = new Set(pruneDescendantIds(itemIds, state));
  const removed = [...removalRoots].filter((itemId) => selectors.itemMeta(state, itemId) != null);

  // Before the lookups change: the walk reads the ancestors from them.
  const changedModels: TItem[] = [];
  const items = removeItemModels(state, removalRoots, changedModels);

  const { lookups, removedIds, parentIds } = removeItemsFromLookups(removalRoots, state);
  // The requested ids the tree does not know may still be selected or expanded.
  for (const itemId of removalRoots) {
    removedIds.add(itemId);
  }

  return {
    items,
    lookups: refreshExpandable(withChangedModels(lookups, state, changedModels), state, parentIds),
    changes: [{ type: 'remove', itemIds: removed }],
    removedIds,
  };
}

/**
 * Inserts items, along with their descendants, at a position. Returns `null`
 * when every item has an id the tree already holds.
 */
export function getInsertionEdit<TItem>(
  state: TreeState<TItem>,
  items: readonly TItem[],
  { parentId, index }: TreeItemDestination,
): TreeItemsEdit<TItem> | null {
  const insertedItems = filterInsertableItems(items, state);
  if (insertedItems.length === 0) {
    return null;
  }

  const lookups = cloneItemsState(state);
  addItemsToLookups(insertedItems, parentId, index, lookups, state);
  const changedModels: TItem[] = [];
  const newItems = insertItemModels(
    state,
    state.items,
    insertedItems,
    parentId,
    index,
    changedModels,
  );
  return {
    items: newItems,
    lookups: refreshExpandable(withChangedModels(lookups, state, changedModels), state, [parentId]),
    changes: [{ type: 'add', items: insertedItems, parentId, index }],
  };
}

/**
 * Moves items, along with their descendants, keeping their tree order. Returns
 * `null` when no known item moves, or the destination is unknown or inside a
 * moved item.
 */
export function getMoveEdit<TItem>(
  state: TreeState<TItem>,
  itemIds: Iterable<TreeItemId>,
  newParentId: TreeItemId | null,
  newIndex: number,
): TreeItemsEdit<TItem> | null {
  // Prune descendants: keep only topmost items (skip items whose ancestor is also in the set).
  // Filter out unknown items first.
  const knownIds = new Set<TreeItemId>();
  for (const id of itemIds) {
    if (selectors.itemMeta(state, id) != null) {
      knownIds.add(id);
    }
  }
  // Sort into the tree's current preorder so the destination preserves the
  // items' visual order, not the caller's set-iteration order.
  const prunedIds = sortIdsByTreeOrder(pruneDescendantIds(knownIds, state), state);

  if (prunedIds.length === 0) {
    return null;
  }

  const prunedIdSet = new Set(prunedIds);

  if (
    newParentId != null &&
    // The destination must still exist. An async update can remove it between
    // the move resolving it and this running, and `insertItemModels` silently
    // finds nowhere to put the items — leaving the *pruned* tree as the result,
    // so the moved items disappear from the render and from consumer data.
    (selectors.itemMeta(state, newParentId) == null ||
      // Reject moves that would create a cycle: the destination parent cannot be
      // one of the moved items, nor sit inside any moved subtree.
      isInSubtreeOf(state, newParentId, prunedIdSet))
  ) {
    return null;
  }

  const itemsToMove = prunedIds.map((id) => selectors.itemModel(state, id)!);

  // The removal of the moved siblings before the target shifts it down.
  const adjustedIndex = getIndexAfterRemoval(state, prunedIds, newParentId, newIndex);

  // Before the lookups change: the walks read the ancestors from them.
  const changedModels: TItem[] = [];
  const withoutItems = removeItemModels(state, prunedIdSet, changedModels);
  const newItems = insertItemModels(
    state,
    withoutItems,
    itemsToMove,
    newParentId,
    adjustedIndex,
    changedModels,
  );

  const { lookups, parentIds } = moveItemsInLookups(prunedIds, newParentId, adjustedIndex, state);

  return {
    items: newItems,
    lookups: refreshExpandable(withChangedModels(lookups, state, changedModels), state, parentIds),
    changes: [{ type: 'move', itemIds: prunedIds, parentId: newParentId, index: adjustedIndex }],
  };
}

/**
 * Replaces an item with another model of the same ID, keeping its position, and
 * rebuilds every ancestor, since a parent model embeds its children. The
 * metadata is read back from the new models, as any accessor can derive from
 * what changed. New children replace the item's subtree.
 * Returns `null` when the item is unknown, or a new child repeats an ID the tree
 * holds outside the subtree.
 */
export function getItemReplacementEdit<TItem>(
  state: TreeState<TItem>,
  itemId: TreeItemId,
  item: TItem,
): TreeItemsEdit<TItem> | null {
  const current = selectors.itemModel(state, itemId);
  if (current === undefined) {
    return null;
  }
  const { itemCollection } = state;
  const children = itemCollection.itemToChildren(item) ?? EMPTY_ARRAY;
  let lookups: Partial<TreeItemsState<TItem>> = {};
  let removedIds: Set<TreeItemId> | undefined;
  if (children !== (itemCollection.itemToChildren(current) ?? EMPTY_ARRAY)) {
    // Checked before the lookups change: a transaction writes them in place, so a
    // rejected replacement must not have touched them.
    if (!children.every(createSubtreeReplacementFilter(state, itemId))) {
      return null;
    }
    const removal = removeItemsFromLookups(
      state.itemOrderedChildrenIdsLookup[getItemIdKey(itemId)] ?? EMPTY_ARRAY,
      state,
    );
    addItemsToLookups(children, itemId, 0, removal.lookups, state);
    lookups = removal.lookups;
    removedIds = removal.removedIds;
  }

  const changedModels: TItem[] = [];
  const newItems = findAndTransformItem(state, state.items, itemId, () => item, changedModels);
  return {
    items: newItems,
    lookups: refreshExpandable(withChangedModels(lookups, state, changedModels), state, [itemId]),
    changes: [{ type: 'update', itemId, item }],
    removedIds,
  };
}

/**
 * Replaces the models of items whose children stay the same, such as with a run
 * of `update` operations. Each changed list of children is copied, and each
 * ancestor rebuilt, once for all of them. Returns `null` when an item is
 * missing from the models of its parent.
 * @param replacements The new model of each item, by key.
 * @param changes The changes the replacements report, in the order they were made.
 */
export function getItemsReplacementEdit<TItem>(
  state: TreeState<TItem>,
  replacements: ReadonlyMap<string, { itemId: TreeItemId; item: TItem }>,
  changes: TreeItemChange<TItem>[],
): TreeItemsEdit<TItem> | null {
  const { itemCollection } = state;
  const targetIds = Array.from(replacements.values(), ({ itemId }) => itemId);
  // Deepest first, so a parent is rebuilt once every changed child is in place.
  const itemIds = [...targetIds, ...collectAncestorIds(state, targetIds)].sort(
    (a, b) => selectors.itemLevel(state, b) - selectors.itemLevel(state, a),
  );
  const childrenCopies = new Map<TreeItemId | null, TItem[]>();
  const changedModels: TItem[] = [];
  for (const itemId of itemIds) {
    let model = replacements.get(getItemIdKey(itemId))?.item ?? selectors.itemModel(state, itemId)!;
    const children = childrenCopies.get(itemId);
    if (children != null) {
      model = writeItemChildren(itemCollection, model, children, 'a Tree nested item mutation');
    }
    changedModels.push(model);

    const parentId = selectors.itemParentId(state, itemId);
    const siblings =
      parentId == null
        ? state.items
        : (itemCollection.itemToChildren(selectors.itemModel(state, parentId)!) ?? EMPTY_ARRAY);
    let index = selectors.itemIndex(state, itemId);
    if (index === -1 || itemCollection.itemToId(siblings[index]) !== itemId) {
      index = siblings.findIndex((sibling) => itemCollection.itemToId(sibling) === itemId);
      if (index === -1) {
        return null;
      }
    }
    let copy = childrenCopies.get(parentId);
    if (copy == null) {
      copy = siblings.slice();
      childrenCopies.set(parentId, copy);
    }
    copy[index] = model;
  }

  return {
    items: childrenCopies.get(null) ?? state.items,
    lookups: refreshExpandable(withChangedModels({}, state, changedModels), state, targetIds),
    changes,
  };
}

/** Copy every lookup of an items state, for a mutation to write into. */
function cloneItemsState<TItem>(state: TreeItemsState<TItem>): TreeItemsState<TItem> {
  return {
    itemModelLookup: copyLookup(state.itemModelLookup),
    itemMetaLookup: copyLookup(state.itemMetaLookup),
    itemOrderedChildrenIdsLookup: copyLookup(state.itemOrderedChildrenIdsLookup),
  };
}

/**
 * Populate lookup tables for a set of sibling items and their descendants.
 */
function populateLookups<TItem>(
  siblings: readonly TItem[],
  parentId: TreeItemId | null,
  level: number,
  parentResolvedDisabled: boolean,
  accessors: TreeItemReaders<TItem>,
  lookups: TreeItemsState<TItem>,
): TreeItemId[] {
  interface Frame {
    siblings: readonly TItem[];
    parentId: TreeItemId | null;
    level: number;
    parentResolvedDisabled: boolean;
    index: number;
    orderedChildrenIds: TreeItemId[];
  }

  const rootFrame: Frame = {
    siblings,
    parentId,
    level,
    parentResolvedDisabled,
    index: 0,
    orderedChildrenIds: [],
  };
  const pending: Frame[] = [rootFrame];

  while (pending.length > 0) {
    const frame = pending[pending.length - 1];
    if (frame.index === frame.siblings.length) {
      const parentKey = getParentKey(frame.parentId);
      lookups.itemOrderedChildrenIdsLookup[parentKey] = frame.orderedChildrenIds;
      pending.pop();
      continue;
    }

    const item = frame.siblings[frame.index];
    frame.index += 1;
    const itemId = accessors.itemToId(item);

    // Skip duplicate ids. A repeated id would be pushed twice into the ordered
    // children lookup, silently duplicating it in the flat list and breaking
    // navigation, so the duplicate (and its subtree) is ignored entirely.
    const itemKey = getItemIdKey(itemId);
    if (lookups.itemMetaLookup[itemKey] != null) {
      if (process.env.NODE_ENV !== 'production') {
        error(
          `Two items have the same id: "${itemId}". ` +
            'Each item must have a unique ID. The duplicate item will be ignored.',
        );
      }
      continue;
    }

    const children = accessors.itemToChildren(item);
    const hasChildren = !!children;
    const hasInlineChildren = hasChildren && children.length > 0;

    frame.orderedChildrenIds.push(itemId);

    const disabled = accessors.isItemDisabled(item);
    const resolvedDisabled = disabled || frame.parentResolvedDisabled;

    lookups.itemModelLookup[itemKey] = item;
    lookups.itemMetaLookup[itemKey] = {
      id: itemId,
      parentId: frame.parentId,
      level: frame.level,
      // Treat `children: []` as a leaf: an empty array is a common shape for a
      // childless node, so only inline children make an item expandable.
      expandable: deriveExpandable(item, accessors),
      disabled,
      resolvedDisabled,
      selectable: !accessors.isItemSelectionDisabled(item),
      label: accessors.itemToStringLabel(item),
    };

    if (hasInlineChildren) {
      pending.push({
        siblings: children,
        parentId: itemId,
        level: frame.level + 1,
        parentResolvedDisabled: resolvedDisabled,
        index: 0,
        orderedChildrenIds: [],
      });
    }
  }

  return rootFrame.orderedChildrenIds;
}

/**
 * Builds the index of `items`.
 */
export function buildItemsState<TItem = TreeDefaultItem>(
  items: readonly TItem[],
  accessors: TreeItemReaders<TItem>,
): TreeItemsState<TItem> {
  const lookups: TreeItemsState<TItem> = {
    itemMetaLookup: createLookup(),
    itemModelLookup: createLookup(),
    itemOrderedChildrenIdsLookup: createLookup(),
  };

  populateLookups(items, null, 1, false, accessors, lookups);

  return lookups;
}

/**
 * The items whose whole subtree has ids the tree does not hold yet. Accepting a
 * parent whose descendant collides would put that duplicate in source data
 * while the lookup builder skips it, making model and metadata lookups disagree.
 */
function filterInsertableItems<TItem>(items: readonly TItem[], state: TreeState<TItem>): TItem[] {
  return items.filter(
    createInsertableItemFilter((id) => state.itemMetaLookup[getItemIdKey(id)] != null, state),
  );
}

/**
 * Returns whether an item can join the new children of `parentId`, whose current
 * subtree they replace: its ids are new to the tree or come from that subtree.
 */
function createSubtreeReplacementFilter<TItem>(
  state: TreeState<TItem>,
  parentId: TreeItemId | null,
): (item: TItem) => boolean {
  const replacedIds = new Set<TreeItemId>();
  forEachDescendant(state.itemOrderedChildrenIdsLookup, parentId, (id) => {
    replacedIds.add(id);
  });
  return createInsertableItemFilter(
    (id) => !replacedIds.has(id) && state.itemMetaLookup[getItemIdKey(id)] != null,
    state,
  );
}

/**
 * Returns whether an item's whole subtree has ids that are neither taken nor held
 * by an item it accepted before, for items considered one after the other.
 */
export function createInsertableItemFilter<TItem>(
  isTaken: (itemId: TreeItemId) => boolean,
  state: TreeState<TItem>,
): (item: TItem) => boolean {
  const { itemCollection } = state;
  const acceptedIds = new Set<TreeItemId>();
  const subtreeIds: TreeItemId[] = [];
  return (item) => {
    subtreeIds.length = 0;
    const pending = [item];
    while (pending.length > 0) {
      const current = pending.pop()!;
      const itemId = itemCollection.itemToId(current);
      if (isTaken(itemId) || acceptedIds.has(itemId)) {
        for (const id of subtreeIds) {
          acceptedIds.delete(id);
        }
        return false;
      }
      acceptedIds.add(itemId);
      subtreeIds.push(itemId);
      const children = itemCollection.itemToChildren(current);
      if (children) {
        for (const child of children) {
          pending.push(child);
        }
      }
    }
    return true;
  };
}

/**
 * Derives the `expandable` flag of the parents whose children an edit changed,
 * from their final models, as `buildItemsState` would.
 */
function refreshExpandable<TItem>(
  lookups: Partial<TreeItemsState<TItem>>,
  state: TreeState<TItem>,
  parentIds: Iterable<TreeItemId | null>,
): Partial<TreeItemsState<TItem>> {
  const modelLookup = lookups.itemModelLookup ?? state.itemModelLookup;
  let metaLookup = lookups.itemMetaLookup ?? state.itemMetaLookup;
  let copied = metaLookup !== state.itemMetaLookup;
  for (const parentId of parentIds) {
    if (parentId == null) {
      continue;
    }
    const itemKey = getItemIdKey(parentId);
    const model = modelLookup[itemKey];
    const meta = metaLookup[itemKey];
    if (model === undefined || meta == null) {
      continue;
    }
    const expandable = deriveExpandable(model, state.itemCollection);
    if (meta.expandable !== expandable) {
      if (!copied) {
        metaLookup = copyLookup(metaLookup);
        copied = true;
      }
      metaLookup[itemKey] = { ...meta, expandable };
    }
  }
  return copied ? { ...lookups, itemMetaLookup: metaLookup } : lookups;
}

/**
 * Update `resolvedDisabled` for all descendants of the given item.
 * The item itself must already have its `resolvedDisabled` set correctly.
 */
function cascadeResolvedDisabled(
  metaLookup: TreeItemKeyed<TreeItemMeta>,
  childrenLookup: Readonly<TreeParentKeyed<readonly TreeItemId[]>>,
  itemId: TreeItemId,
  parentResolvedDisabled: boolean,
): void {
  const pending = [{ itemId, parentResolvedDisabled }];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const childId of childrenLookup[getItemIdKey(current.itemId)] ?? EMPTY_ARRAY) {
      const childKey = getItemIdKey(childId);
      const meta = metaLookup[childKey];
      if (!meta) {
        continue;
      }
      const resolvedDisabled = meta.disabled || current.parentResolvedDisabled;
      if (meta.resolvedDisabled !== resolvedDisabled) {
        metaLookup[childKey] = { ...meta, resolvedDisabled };
        pending.push({ itemId: childId, parentResolvedDisabled: resolvedDisabled });
      }
    }
  }
}

/**
 * Remove items and their descendants from all lookup tables. Returns the new
 * lookups, the ids removed from them, and the surviving parents that lost children.
 */
function removeItemsFromLookups<TItem>(
  itemIds: Iterable<TreeItemId>,
  state: TreeState<TItem>,
): {
  lookups: TreeItemsState<TItem>;
  removedIds: Set<TreeItemId>;
  parentIds: Set<TreeItemId | null>;
} {
  const allIdsToRemove = new Set<TreeItemId>();
  const affectedParentIds = new Set<TreeItemId | null>();
  const remove = (id: TreeItemId) => {
    allIdsToRemove.add(id);
  };

  for (const itemId of itemIds) {
    const meta = state.itemMetaLookup[getItemIdKey(itemId)];
    if (!meta) {
      continue;
    }
    affectedParentIds.add(meta.parentId);
    remove(itemId);
    forEachDescendant(state.itemOrderedChildrenIdsLookup, itemId, remove);
  }

  const lookups = cloneItemsState(state);
  for (const id of allIdsToRemove) {
    const itemKey = getItemIdKey(id);
    delete lookups.itemModelLookup[itemKey];
    delete lookups.itemMetaLookup[itemKey];
    delete lookups.itemOrderedChildrenIdsLookup[itemKey];
  }

  for (const parentId of affectedParentIds) {
    // A parent removed along with its child has no lookup entries left to update.
    if (parentId != null && allIdsToRemove.has(parentId)) {
      affectedParentIds.delete(parentId);
      continue;
    }
    const parentKey = getParentKey(parentId);
    const oldChildren = state.itemOrderedChildrenIdsLookup[parentKey];
    if (!oldChildren) {
      continue;
    }
    lookups.itemOrderedChildrenIdsLookup[parentKey] = oldChildren.filter(
      (id) => !allIdsToRemove.has(id),
    );
  }

  return { lookups, removedIds: allIdsToRemove, parentIds: affectedParentIds };
}

/** Add items and their descendants to lookups the mutation owns. */
function addItemsToLookups<TItem>(
  items: readonly TItem[],
  parentId: TreeItemId | null,
  insertIndex: number,
  lookups: TreeItemsState<TItem>,
  state: TreeState<TItem>,
): void {
  const parentKey = getParentKey(parentId);
  const parentMeta = parentId != null ? state.itemMetaLookup[getItemIdKey(parentId)] : null;

  // `populateLookups` replaces the parent's children with the new items, so
  // the existing siblings are read first and the new ids inserted among them.
  const siblingIds = lookups.itemOrderedChildrenIdsLookup[parentKey] ?? EMPTY_ARRAY;
  const newChildIds = populateLookups(
    items,
    parentId,
    parentMeta ? parentMeta.level + 1 : 1,
    parentMeta?.resolvedDisabled ?? false,
    state.itemCollection,
    lookups,
  );
  if (siblingIds.length > 0) {
    lookups.itemOrderedChildrenIdsLookup[parentKey] = insertAt(
      siblingIds,
      insertIndex,
      newChildIds,
    );
  }
}

/**
 * Move items in the lookup tables: remove from old parents, add to new parent,
 * and update parentId/level for moved subtrees. Returns the lookups and the
 * parents whose children changed.
 */
function moveItemsInLookups(
  itemIds: TreeItemId[],
  newParentId: TreeItemId | null,
  newIndex: number,
  state: TreeState,
): { lookups: Partial<TreeItemsState>; parentIds: Set<TreeItemId | null> } {
  const newParentKey = getParentKey(newParentId);
  const newParentMeta =
    newParentId != null ? state.itemMetaLookup[getItemIdKey(newParentId)] : null;
  const newLevel = newParentMeta ? newParentMeta.level + 1 : 1;

  const staysUnderSameParent = itemIds.every(
    (id) => state.itemMetaLookup[getItemIdKey(id)]?.parentId === newParentId,
  );
  const itemMetaLookup = staysUnderSameParent
    ? state.itemMetaLookup
    : copyLookup(state.itemMetaLookup);
  const itemOrderedChildrenIdsLookup = copyLookup(state.itemOrderedChildrenIdsLookup);

  const affectedOldParentIds = new Set<TreeItemId | null>();
  const itemIdSet = new Set(itemIds);

  for (const id of itemIds) {
    const meta = state.itemMetaLookup[getItemIdKey(id)];
    if (meta) {
      affectedOldParentIds.add(meta.parentId);
    }
  }

  for (const parentId of affectedOldParentIds) {
    const parentKey = getParentKey(parentId);
    const oldChildren = itemOrderedChildrenIdsLookup[parentKey] ?? [];
    itemOrderedChildrenIdsLookup[parentKey] = oldChildren.filter((id) => !itemIdSet.has(id));
  }

  const currentNewParentChildren = itemOrderedChildrenIdsLookup[newParentKey] ?? [];
  itemOrderedChildrenIdsLookup[newParentKey] = insertAt(
    currentNewParentChildren,
    newIndex,
    itemIds,
  );

  if (!staysUnderSameParent) {
    // Update parentId, level, and resolvedDisabled for moved items and their descendants
    const newParentResolvedDisabled = newParentMeta?.resolvedDisabled ?? false;

    const pending = itemIds.map((id) => ({
      id,
      parentId: newParentId,
      level: newLevel,
      parentResolvedDisabled: newParentResolvedDisabled,
    }));
    while (pending.length > 0) {
      const current = pending.pop()!;
      const itemKey = getItemIdKey(current.id);
      const oldMeta = itemMetaLookup[itemKey];
      if (!oldMeta) {
        continue;
      }
      const resolvedDisabled = oldMeta.disabled || current.parentResolvedDisabled;
      itemMetaLookup[itemKey] = {
        ...oldMeta,
        parentId: current.parentId,
        level: current.level,
        resolvedDisabled,
      };
      for (const childId of itemOrderedChildrenIdsLookup[itemKey] ?? EMPTY_ARRAY) {
        pending.push({
          id: childId,
          parentId: current.id,
          level: current.level + 1,
          parentResolvedDisabled: resolvedDisabled,
        });
      }
    }
  }

  affectedOldParentIds.add(newParentId);
  return {
    // itemModelLookup doesn't change for moves
    lookups: { itemMetaLookup, itemOrderedChildrenIdsLookup },
    parentIds: affectedOldParentIds,
  };
}

function removeItemModels<TItem>(
  state: TreeState<TItem>,
  idsToRemove: ReadonlySet<TreeItemId>,
  changedModels: TItem[],
): readonly TItem[] {
  const { items, itemCollection } = state;
  const branchIds = collectAncestorIds(state, idsToRemove);
  // `result` stays null while the siblings are unchanged, so untouched
  // branches are returned as they are rather than copied.
  type Frame = { items: readonly TItem[]; index: number; result: TItem[] | null };
  const pending: Frame[] = [{ items, index: 0, result: null }];
  while (pending.length > 0) {
    const frame = pending[pending.length - 1];
    if (frame.index === frame.items.length) {
      pending.pop();
      const parent = pending[pending.length - 1];
      if (!parent) {
        return frame.result ?? frame.items;
      }
      const item = parent.items[parent.index];
      if (frame.result != null) {
        const changedItem = writeItemChildren(
          itemCollection,
          item,
          frame.result,
          'a Tree structural mutation',
        );
        changedModels.push(changedItem);
        parent.result ??= parent.items.slice(0, parent.index);
        parent.result.push(changedItem);
      } else {
        parent.result?.push(item);
      }
      parent.index += 1;
      continue;
    }
    const item = frame.items[frame.index];
    const itemId = itemCollection.itemToId(item);
    if (idsToRemove.has(itemId)) {
      frame.result ??= frame.items.slice(0, frame.index);
      frame.index += 1;
      continue;
    }
    const children = branchIds.has(itemId) ? itemCollection.itemToChildren(item) : undefined;
    if (children && children.length > 0) {
      pending.push({ items: children, index: 0, result: null });
    } else {
      frame.result?.push(item);
      frame.index += 1;
    }
  }
  return items;
}

/**
 * Replaces a model in `items`, then copies its ancestor path. The path is read
 * from `state`, so `items` must keep the target's ancestors where `state` has them.
 */
function findAndTransformItem<TItem>(
  state: TreeState<TItem>,
  items: readonly TItem[],
  targetId: TreeItemId,
  onMatch: (item: TItem) => TItem,
  changedModels: TItem[],
): readonly TItem[] {
  const { itemCollection } = state;
  const branchIds = collectAncestorIds(state, [targetId]);
  const pending = [{ items, index: 0 }];
  while (pending.length > 0) {
    const frame = pending[pending.length - 1];
    if (frame.index === frame.items.length) {
      pending.pop();
      if (pending.length > 0) {
        pending[pending.length - 1].index += 1;
      }
      continue;
    }
    const item = frame.items[frame.index];
    const itemId = itemCollection.itemToId(item);
    if (itemId === targetId) {
      let changedItem = onMatch(item);
      changedModels.push(changedItem);
      let result = frame.items.slice();
      result[frame.index] = changedItem;
      pending.pop();
      while (pending.length > 0) {
        const parent = pending.pop()!;
        changedItem = writeItemChildren(
          itemCollection,
          parent.items[parent.index],
          result,
          'a Tree nested item mutation',
        );
        changedModels.push(changedItem);
        result = parent.items.slice();
        result[parent.index] = changedItem;
      }
      return result;
    }
    const children = branchIds.has(itemId) ? itemCollection.itemToChildren(item) : undefined;
    if (children && children.length > 0) {
      pending.push({ items: children, index: 0 });
    } else {
      frame.index += 1;
    }
  }
  return items;
}

function insertItemModels<TItem>(
  state: TreeState<TItem>,
  items: readonly TItem[],
  newItems: readonly TItem[],
  parentId: TreeItemId | null,
  index: number,
  changedModels: TItem[],
): readonly TItem[] {
  if (parentId === null) {
    return insertAt(items, index, newItems);
  }
  const { itemCollection } = state;
  return findAndTransformItem(
    state,
    items,
    parentId,
    (item) =>
      writeItemChildren(
        itemCollection,
        item,
        insertAt(itemCollection.itemToChildren(item) ?? [], index, newItems),
        'a Tree insertion',
      ),
    changedModels,
  );
}

/**
 * Writes the models a mutation rebuilt into the model lookup, then re-derives
 * their metadata: an item a writer changed, and the ancestors that got new
 * children, since an accessor can read the children, such as a label with a
 * child count. Lookups the mutation already copied are written in place.
 */
function withChangedModels<TItem>(
  lookups: Partial<TreeItemsState<TItem>>,
  state: TreeState<TItem>,
  models: readonly TItem[],
): Partial<TreeItemsState<TItem>> {
  if (models.length === 0) {
    return lookups;
  }
  const { itemCollection } = state;
  const itemModelLookup = lookups.itemModelLookup ?? copyLookup(state.itemModelLookup);
  let itemMetaLookup = lookups.itemMetaLookup ?? state.itemMetaLookup;
  let copied = itemMetaLookup !== state.itemMetaLookup;
  for (const model of models) {
    const itemId = itemCollection.itemToId(model);
    const itemKey = getItemIdKey(itemId);
    itemModelLookup[itemKey] = model;
    const meta = itemMetaLookup[itemKey];
    if (meta == null) {
      continue;
    }
    const label = itemCollection.itemToStringLabel(model);
    const disabled = itemCollection.isItemDisabled(model);
    const selectable = !itemCollection.isItemSelectionDisabled(model);
    if (label === meta.label && disabled === meta.disabled && selectable === meta.selectable) {
      continue;
    }
    if (!copied) {
      itemMetaLookup = copyLookup(itemMetaLookup);
      copied = true;
    }
    const parentResolvedDisabled =
      meta.parentId != null
        ? (itemMetaLookup[getItemIdKey(meta.parentId)]?.resolvedDisabled ?? false)
        : false;
    const resolvedDisabled = disabled || parentResolvedDisabled;
    itemMetaLookup[itemKey] = { ...meta, label, disabled, resolvedDisabled, selectable };
    if (resolvedDisabled !== meta.resolvedDisabled) {
      cascadeResolvedDisabled(
        itemMetaLookup,
        lookups.itemOrderedChildrenIdsLookup ?? state.itemOrderedChildrenIdsLookup,
        itemId,
        resolvedDisabled,
      );
    }
  }
  return { ...lookups, itemModelLookup, itemMetaLookup };
}

/**
 * A copy of `array` with `values` inserted at `index`. Unlike a spread into
 * `splice()`, it accepts more values than a call accepts arguments.
 */
function insertAt<T>(array: readonly T[], index: number, values: readonly T[]): T[] {
  return array.slice(0, index).concat(values, array.slice(index));
}
