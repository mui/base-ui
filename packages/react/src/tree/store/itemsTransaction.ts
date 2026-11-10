import { clamp } from '@base-ui/utils/clamp';
import { warn } from '@base-ui/utils/warn';
import type {
  TreeItemId,
  TreeItemPosition,
  TreeItemDestination,
  TreeItemChange,
  TreeItemTransaction,
  TreeState,
} from './types';
import { selectors } from './selectors';
import { getItemIdKey } from '../utils/itemIdKey';
import {
  createInsertableItemFilter,
  getInsertionEdit,
  withDraftLookups,
  getItemReplacementEdit,
  getItemsReplacementEdit,
  getMoveEdit,
  getRemovalEdit,
} from './itemIndex';
import type { TreeItemsEdit } from './itemIndex';

/**
 * An operation of an items change. The ID of an inserted item is read when the
 * operation is recorded.
 */
export type TreeItemsOperation<TItem> =
  | {
      type: 'add' | 'set';
      itemId: TreeItemId;
      item: TItem;
      position: TreeItemPosition | undefined;
    }
  | { type: 'update'; itemId: TreeItemId; patch: Partial<TItem> }
  | { type: 'move'; itemIds: readonly TreeItemId[]; position: TreeItemPosition }
  | { type: 'remove'; itemId: TreeItemId };

/**
 * Calls `callback` with a transaction and returns the operations it recorded, in call order.
 */
export function recordItemsTransaction<TItem>(
  callback: (transaction: TreeItemTransaction<TItem>) => void,
  itemToId: (item: TItem) => TreeItemId,
): TreeItemsOperation<TItem>[] {
  const operations: TreeItemsOperation<TItem>[] = [];
  let recording = true;

  const record = (createOperation: () => TreeItemsOperation<TItem>) => {
    if (!recording) {
      throw new Error(
        'Base UI: A Tree items transaction was used after its callback returned. ' +
          'The transaction is applied when the callback returns, so this change would be lost. ' +
          'Record every change synchronously within the callback, and apply a new transaction for changes that come later.',
      );
    }
    operations.push(createOperation());
  };

  const transaction: TreeItemTransaction<TItem> = {
    add: (item, position) =>
      record(() => ({ type: 'add', itemId: itemToId(item), item, position })),
    set: (item, position) =>
      record(() => ({ type: 'set', itemId: itemToId(item), item, position })),
    update: (itemId, patch) => record(() => ({ type: 'update', itemId, patch })),
    // An array rather than an iterable, since a string ID is iterable too.
    move: (itemIds, position) =>
      record(() => ({
        type: 'move',
        itemIds: typeof itemIds === 'object' ? itemIds.slice() : [itemIds],
        position,
      })),
    remove: (itemId) => record(() => ({ type: 'remove', itemId })),
  };

  try {
    callback(transaction);
  } finally {
    recording = false;
  }

  return operations;
}

export interface TreeTransactionResult<TItem> {
  /** The items change, or `null` when no operation changed anything. */
  edit: TreeItemsEdit<TItem> | null;
}

/**
 * Applies the operations of a transaction to `state`, in order, as a single edit.
 * Each operation applies to the items as the previous ones left them.
 */
export function getTransactionEdit<TItem>(
  state: TreeState<TItem>,
  operations: readonly TreeItemsOperation<TItem>[],
): TreeTransactionResult<TItem> {
  return withDraftLookups(() => applyOperations(state, operations));
}

function applyOperations<TItem>(
  state: TreeState<TItem>,
  operations: readonly TreeItemsOperation<TItem>[],
): TreeTransactionResult<TItem> {
  let next = state;
  const changes: TreeItemChange<TItem>[] = [];
  const removedIds = new Set<TreeItemId>();
  for (let index = 0; index < operations.length;) {
    // Each edit copies the items and the children lists it changes, so consecutive
    // insertions next to each other, removals, and replacements are applied as one.
    const run = getRunEdit(next, operations, index);
    const edit = run?.edit ?? getOperationEdit(next, operations[index]);
    index += run?.length ?? 1;
    if (edit == null || edit.items === next.items) {
      continue;
    }
    next = { ...next, items: edit.items, ...edit.lookups };
    changes.push(...edit.changes);
    edit.removedIds?.forEach((id) => removedIds.add(id));
  }
  if (next === state) {
    return { edit: null };
  }

  // An item removed and added again is the same item, so it stays selected and expanded.
  for (const id of removedIds) {
    if (selectors.itemMeta(next, id) != null) {
      removedIds.delete(id);
    }
  }

  const { itemModelLookup, itemMetaLookup, itemOrderedChildrenIdsLookup } = next;
  return {
    edit: {
      items: next.items,
      lookups: { itemModelLookup, itemMetaLookup, itemOrderedChildrenIdsLookup },
      changes,
      removedIds,
    },
  };
}

/**
 * The edit of the operations from `start` that apply as one: removals in a row,
 * model replacements in a row, or insertions in a row that each land right after
 * the previous one. Returns
 * `null` for a single operation, or a run that skips an item, which then applies
 * one operation at a time.
 */
function getRunEdit<TItem>(
  state: TreeState<TItem>,
  operations: readonly TreeItemsOperation<TItem>[],
  start: number,
): { edit: TreeItemsEdit<TItem> | null; length: number } | null {
  const first = operations[start];
  if (first.type === 'remove') {
    // Unknown IDs are kept: one may still be selected or expanded, and a removal
    // that changes the tree drops them from both.
    const itemIds = new Set<TreeItemId>();
    let removesItem = false;
    let end = start;
    for (; end < operations.length; end += 1) {
      const operation = operations[end];
      if (operation.type !== 'remove') {
        break;
      }
      itemIds.add(operation.itemId);
      removesItem ||= selectors.itemMeta(state, operation.itemId) != null;
    }
    if (end - start === 1) {
      return null;
    }
    return {
      edit: removesItem ? getRemovalEdit(state, itemIds) : null,
      length: end - start,
    };
  }

  if (
    (first.type === 'update' || first.type === 'set') &&
    selectors.itemMeta(state, first.itemId) != null
  ) {
    return getReplacementRunEdit(state, operations, start);
  }

  // A run stops before an item with a duplicate ID, which then applies on its own and warns.
  const isInsertable = createInsertableItemFilter(
    (id) => selectors.itemMeta(state, id) != null,
    state,
  );
  if (!isInsertion(state, first) || !isInsertable(first.item)) {
    return null;
  }
  const destination = resolvePosition(state, first.position);
  if (destination == null) {
    return null;
  }
  const childCount = selectors.itemOrderedChildrenIds(state, destination.parentId).length;
  const items = [first.item];
  for (let index = start + 1; index < operations.length; index += 1) {
    const operation = operations[index];
    const previous = operations[index - 1] as typeof first;
    if (
      !isInsertion(state, operation) ||
      !continuesInsertion(
        state,
        operation.position,
        destination,
        childCount,
        items.length,
        previous,
      ) ||
      !isInsertable(operation.item)
    ) {
      break;
    }
    items.push(operation.item);
  }
  if (items.length === 1) {
    return null;
  }
  return {
    edit: getInsertionEdit(state, items, destination),
    length: items.length,
  };
}

/**
 * The edit of the `update` and `set` operations from `start` that replace models
 * of items the tree has, keeping their IDs and children. The run stops before an
 * operation on an ancestor of an item it replaces, which would rebuild the
 * ancestor from the children it had before the run.
 */
function getReplacementRunEdit<TItem>(
  state: TreeState<TItem>,
  operations: readonly TreeItemsOperation<TItem>[],
  start: number,
): { edit: TreeItemsEdit<TItem> | null; length: number } | null {
  const { itemToId, itemToChildren } = state.itemCollection;
  const replacements = new Map<string, { itemId: TreeItemId; item: TItem }>();
  const ancestorKeys = new Set<string>();
  const changes: TreeItemChange<TItem>[] = [];
  let end = start;
  for (; end < operations.length; end += 1) {
    const operation = operations[end];
    if (operation.type !== 'update' && operation.type !== 'set') {
      break;
    }
    const { itemId } = operation;
    const key = getItemIdKey(itemId);
    const current = replacements.get(key)?.item ?? selectors.itemModel(state, itemId);
    if (current === undefined || ancestorKeys.has(key)) {
      break;
    }
    let item: TItem;
    if (operation.type === 'update') {
      if (isNoopPatch(current, operation.patch)) {
        continue;
      }
      item = { ...current, ...operation.patch };
    } else if (current === operation.item) {
      continue;
    } else {
      item = operation.item;
    }
    // An operation that changes the ID or the children applies on its own.
    if (itemToId(item) !== itemId || itemToChildren(item) !== itemToChildren(current)) {
      break;
    }
    replacements.set(key, { itemId, item });
    changes.push({ type: 'update', itemId, item });
    for (
      let parentId = selectors.itemParentId(state, itemId);
      parentId != null && !ancestorKeys.has(getItemIdKey(parentId));
      parentId = selectors.itemParentId(state, parentId)
    ) {
      ancestorKeys.add(getItemIdKey(parentId));
    }
  }
  if (end - start < 2) {
    return null;
  }
  if (replacements.size === 0) {
    return { edit: null, length: end - start };
  }
  const edit = getItemsReplacementEdit(state, replacements, changes);
  return edit == null ? null : { edit, length: end - start };
}

/** Whether a patch leaves every field of `current` as it is. Symbol keys count too, as the spread copies them. */
function isNoopPatch<TItem>(current: TItem, patch: Partial<TItem>): boolean {
  return Reflect.ownKeys(patch).every(
    (key) =>
      !Object.prototype.propertyIsEnumerable.call(patch, key) ||
      Object.is(current[key as keyof TItem], patch[key as keyof TItem]),
  );
}

function isInsertion<TItem>(
  state: TreeState<TItem>,
  operation: TreeItemsOperation<TItem>,
): operation is Extract<TreeItemsOperation<TItem>, { type: 'add' | 'set' }> {
  return (
    (operation.type === 'add' || operation.type === 'set') &&
    selectors.itemMeta(state, operation.itemId) == null
  );
}

/**
 * Whether an insertion lands right after the `offset` items a run inserts at
 * `destination`, where the parent had `childCount` children before the run.
 */
function continuesInsertion(
  state: TreeState,
  position: TreeItemPosition | undefined,
  destination: TreeItemDestination,
  childCount: number,
  offset: number,
  previous: { itemId: TreeItemId },
): boolean {
  const index = destination.index + offset;
  if (position == null || 'parentId' in position) {
    const parentId = position == null ? null : position.parentId;
    const count = childCount + offset;
    return (
      parentId === destination.parentId &&
      clamp(Math.trunc(position?.index ?? count) || 0, 0, count) === index
    );
  }
  if ('after' in position) {
    return position.after === previous.itemId;
  }
  // The run inserts before this item, which moves along as the run grows.
  const meta = selectors.itemMeta(state, position.before);
  return (
    meta != null &&
    meta.parentId === destination.parentId &&
    selectors.itemIndex(state, position.before) === destination.index
  );
}

function getOperationEdit<TItem>(
  state: TreeState<TItem>,
  operation: TreeItemsOperation<TItem>,
): TreeItemsEdit<TItem> | null {
  if (operation.type === 'remove') {
    return selectors.itemMeta(state, operation.itemId) == null
      ? null
      : getRemovalEdit(state, new Set([operation.itemId]));
  }

  if (operation.type === 'move') {
    const destination = resolvePosition(state, operation.position, 'move');
    return destination == null
      ? null
      : getMoveEdit(state, operation.itemIds, destination.parentId, destination.index);
  }

  const current = selectors.itemModel(state, operation.itemId);
  if (operation.type === 'update') {
    if (current === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          `applyTransaction() \`update\` received a patch for ID ${JSON.stringify(operation.itemId)}, which does not match any item.`,
          'There is no item to merge the patch into, so it was skipped.',
          'Use `add` or `set` to insert the item instead.',
        );
      }
      return null;
    }
    const { patch } = operation;
    // A patch that changes no field leaves the model as it is, so it doesn't notify.
    if (isNoopPatch(current, patch)) {
      return null;
    }
    return getReplacement(state, operation.itemId, { ...current, ...patch });
  }

  if (current === undefined) {
    const destination = resolvePosition(state, operation.position, operation.type);
    const edit =
      destination == null ? null : getInsertionEdit(state, [operation.item], destination);
    if (destination != null && edit == null && process.env.NODE_ENV !== 'production') {
      warn(
        `applyTransaction() \`${operation.type}\` received an item with ID ${JSON.stringify(operation.itemId)} whose descendants repeat an ID.`,
        'Inserting it would duplicate the ID, so the item was skipped.',
        'Give every descendant an ID the tree does not have yet.',
      );
    }
    return edit;
  }

  if (operation.type === 'add') {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        `applyTransaction() \`add\` received an item with ID ${JSON.stringify(operation.itemId)}, which already exists.`,
        'Inserting it would duplicate the ID, so the item was skipped.',
        'Use `set` to replace the item wholesale, or `update` to merge fields into it.',
      );
    }
    return null;
  }

  // The tree already holds this model, so sending it again changes nothing.
  return current === operation.item
    ? null
    : getReplacement(state, operation.itemId, operation.item);
}

function getReplacement<TItem>(
  state: TreeState<TItem>,
  itemId: TreeItemId,
  item: TItem,
): TreeItemsEdit<TItem> | null {
  const newId = state.itemCollection.itemToId(item);
  if (newId !== itemId) {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        `applyTransaction() changed the ID of the item with ID ${JSON.stringify(itemId)} to ${JSON.stringify(newId)}.`,
        'The item would stay stored under its previous ID, so the change was skipped.',
        'Remove the item and `add` it with the new ID instead.',
      );
    }
    return null;
  }
  const edit = getItemReplacementEdit(state, itemId, item);
  if (edit == null && process.env.NODE_ENV !== 'production') {
    warn(
      `applyTransaction() received children for the item with ID ${JSON.stringify(itemId)} that repeat an ID.`,
      'Replacing its children would duplicate the ID, so the change was skipped.',
      'Give every child an ID the tree does not have outside the item.',
    );
  }
  return edit;
}

/**
 * The destination a position points to, or `null` when it references an item the tree doesn't have.
 * Unlike Mosaic, which appends a row whose reference is unknown, this skips the operation:
 * in a tree the end of the root is usually the wrong level, and a consumer saving
 * `onItemsChange` would persist the item there.
 */
function resolvePosition(
  state: TreeState,
  position: TreeItemPosition | undefined,
  operation?: string,
): TreeItemDestination | null {
  if (position == null) {
    return { parentId: null, index: selectors.itemOrderedChildrenIds(state, null).length };
  }
  let referenceId: TreeItemId | null;
  let destination: TreeItemDestination | null = null;
  if ('parentId' in position) {
    referenceId = position.parentId;
    if (referenceId === null || selectors.itemMeta(state, referenceId) != null) {
      const childCount = selectors.itemOrderedChildrenIds(state, referenceId).length;
      destination = {
        parentId: referenceId,
        index: clamp(Math.trunc(position.index ?? childCount) || 0, 0, childCount),
      };
    }
  } else {
    const before = 'before' in position;
    referenceId = before ? position.before : position.after;
    const meta = selectors.itemMeta(state, referenceId);
    if (meta != null) {
      destination = {
        parentId: meta.parentId,
        index: selectors.itemIndex(state, referenceId) + (before ? 0 : 1),
      };
    }
  }
  if (destination == null && operation != null && process.env.NODE_ENV !== 'production') {
    warn(
      `applyTransaction() \`${operation}\` received a position next to or under ID ${JSON.stringify(referenceId)}, which does not match any item.`,
      'There is nowhere to place the item, so the operation was skipped.',
      'Pass the ID of an existing item, or `parentId: null` for the root.',
    );
  }
  return destination;
}
