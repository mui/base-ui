'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { warn } from '@base-ui/utils/warn';
import type {
  VirtualizerGroup,
  VirtualizerGetGroupKey,
  VirtualizerItemRowModel,
  VirtualizerRow,
  VirtualizerRowModel,
} from './types';

type VirtualizerItemKey = string;

/**
 * Prefix of a group header row's id. Item ids start with a primitive type name or the
 * `object:`/`symbol:` registry prefixes, so the two namespaces cannot collide.
 */
const GROUP_HEADER_KEY_PREFIX = 'group-header:';

export interface UseRowModelsParameters<Item> {
  getItemKey: ((item: Item) => string | number) | undefined;
  items: ReadonlyArray<Item>;
}

/**
 * Turns a collection into the keyed rows the engine windows.
 *
 * A row's key is its identity across every geometry cache: measured heights, the estimate
 * samples, and the retained focus row all follow it, so a value that cannot produce a stable key
 * is a bug worth reporting rather than one to paper over. The array itself keeps its identity
 * while every row still describes the same item at the same index, because a fresh array of
 * equal rows is not a collection change and would rehydrate the engine's geometry for nothing.
 */
export function useRowModels<Item>(
  parameters: UseRowModelsParameters<Item>,
): VirtualizerRow<VirtualizerItemRowModel<Item>>[] {
  const { getItemKey, items } = parameters;

  const objectKeyRegistry = useRefWithInit(createObjectKeyRegistry).current;
  const hasGetItemKey = getItemKey != null;
  // Read through a ref so the collection, not the callback's identity, decides when these run
  // again. A feature layer writes them inline, which makes a new identity on each of its renders;
  // keying on that would re-derive a key and an estimate for every item each time, in the
  // component whose whole purpose is not to touch every item. They are contracted as pure
  // functions of the item, and `remeasure()` is how a change in what they return is announced.
  const getItemKeyRef = React.useRef(getItemKey);
  getItemKeyRef.current = getItemKey;
  const rowsCacheRef = React.useRef<VirtualizerRow<VirtualizerItemRowModel<Item>>[] | null>(null);

  return React.useMemo<VirtualizerRow<VirtualizerItemRowModel<Item>>[]>(() => {
    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<VirtualizerItemKey>();

    const nextRows = items.map((item, itemIndex) => {
      const rawKey = hasGetItemKey ? getItemKeyRef.current!(item) : undefined;
      const key = hasGetItemKey
        ? normalizeItemKey(rawKey)
        : getDefaultItemKey(item, objectKeyRegistry);

      if (process.env.NODE_ENV !== 'production') {
        if (isObjectValue(item) && !hasGetItemKey) {
          warn(
            '<Virtualizer> requires `getItemKey` when item values are objects. ' +
              'Return a stable string or number that uniquely identifies each item.',
          );
        }
        if (keys?.has(key)) {
          warn(
            '<Virtualizer> received the duplicate item key ' +
              `\`${String(rawKey ?? item)}\`. Each item must have a unique key.`,
          );
        }
        keys?.add(key);
      }

      return {
        id: key,
        model: {
          item,
          itemIndex,
        },
      };
    });

    const previousRows = rowsCacheRef.current;
    if (previousRows != null && areVirtualizerRowsEqual(previousRows, nextRows)) {
      return previousRows;
    }

    rowsCacheRef.current = nextRows;
    return nextRows;
  }, [hasGetItemKey, items, objectKeyRegistry]);
}

/**
 * One group of a grouped projection, in row coordinates.
 */
export interface GroupDescriptor {
  /** The normalized group key, which is also the wrapper's React key. */
  key: string;
  /**
   * A small integer assigned to the key on first sight and kept for the virtualizer's lifetime,
   * for building an id that follows the key without carrying its characters.
   */
  ordinal: number;
  headerRowIndex: number;
  /** Half-open item range of the group. */
  itemStart: number;
  itemEnd: number;
}

/**
 * The rows of a grouped collection, and the tables that relate them to its items.
 */
export interface GroupedRows<Item> {
  /** Every row, headers included. Item rows are the same objects as the flat item rows. */
  rows: VirtualizerRow<VirtualizerRowModel<Item>>[];
  groups: GroupDescriptor[];
  /** Row index of each item. */
  itemToRowIndex: number[];
  /** Number of items strictly before each row, with a sentinel at `rows.length`. */
  itemCountBeforeRow: number[];
  /** The group each row belongs to. */
  rowToGroupIndex: number[];
}

export interface UseGroupedRowModelsParameters<Item> {
  getGroupKey: VirtualizerGetGroupKey<Item> | undefined;
  /** The grouped view of the item rows' collection, or `undefined` when nothing is grouped. */
  groups: ReadonlyArray<VirtualizerGroup<Item>> | undefined;
  itemRows: VirtualizerRow<VirtualizerItemRowModel<Item>>[];
}

/**
 * Interleaves group header rows with the item rows, and relates the two index spaces.
 *
 * Kept beside {@link useRowModels} rather than inside it: the item rows and their cache are what
 * a flat list needs and nothing more, so a flat list never pays for this — with no groups the hook
 * returns `null` without allocating. A grouped collection derives its projection once per
 * collection change, and keeps the previous one while every group still covers the same items
 * under the same key, so a list that recreates its group objects on every filter pass does not
 * rehydrate the engine's geometry for nothing.
 */
export function useGroupedRowModels<Item>(
  parameters: UseGroupedRowModelsParameters<Item>,
): GroupedRows<Item> | null {
  const { getGroupKey, groups, itemRows } = parameters;

  const hasGetGroupKey = getGroupKey != null;
  const getGroupKeyRef = React.useRef(getGroupKey);
  getGroupKeyRef.current = getGroupKey;
  const ordinalRegistry = useRefWithInit(() => new Map<string, number>()).current;
  const cacheRef = React.useRef<GroupedRows<Item> | null>(null);

  return React.useMemo<GroupedRows<Item> | null>(() => {
    if (groups == null) {
      return null;
    }

    let total = 0;
    for (const group of groups) {
      total += group.items.length;
    }

    if (total !== itemRows.length) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          '<Virtualizer> received `groups` and `items` that describe different collections: ' +
            `the groups hold ${total} items while the flat collection holds ${itemRows.length}. ` +
            'A list must publish the same filtered partition as its flat items. ' +
            'The items are rendered without groups.',
        );
      }
      // Wrong is worse than flat here: a partition that does not match the items would put options
      // under the wrong label.
      return null;
    }

    const keys = process.env.NODE_ENV === 'production' ? undefined : new Set<string>();
    const rows: VirtualizerRow<VirtualizerRowModel<Item>>[] = [];
    const descriptors: GroupDescriptor[] = [];
    const itemToRowIndex: number[] = new Array(itemRows.length);
    const itemCountBeforeRow: number[] = [];
    const rowToGroupIndex: number[] = [];
    let itemIndex = 0;

    groups.forEach((group, groupIndex) => {
      const rawKey = hasGetGroupKey ? getGroupKeyRef.current!(group) : groupIndex;
      const key = normalizeItemKey(rawKey);

      if (process.env.NODE_ENV !== 'production') {
        if (keys?.has(key)) {
          warn(
            `<Virtualizer> received the duplicate group key \`${String(rawKey)}\`. ` +
              'Each group must have a unique key.',
          );
        }
        keys?.add(key);
      }

      let ordinal = ordinalRegistry.get(key);
      if (ordinal === undefined) {
        ordinal = ordinalRegistry.size;
        ordinalRegistry.set(key, ordinal);
      }

      descriptors.push({
        key,
        ordinal,
        headerRowIndex: rows.length,
        itemStart: itemIndex,
        itemEnd: itemIndex + group.items.length,
      });
      rows.push({
        id: `${GROUP_HEADER_KEY_PREFIX}${key}`,
        model: { kind: 'group-header', groupIndex, itemStart: itemIndex, ordinal },
      });
      rowToGroupIndex.push(groupIndex);
      itemCountBeforeRow.push(itemIndex);

      for (let offset = 0; offset < group.items.length; offset += 1) {
        itemToRowIndex[itemIndex] = rows.length;
        rows.push(itemRows[itemIndex]);
        rowToGroupIndex.push(groupIndex);
        itemCountBeforeRow.push(itemIndex);
        itemIndex += 1;
      }
    });
    itemCountBeforeRow.push(itemIndex);

    const previous = cacheRef.current;
    if (
      previous != null &&
      previous.rows.length === rows.length &&
      areArraysEqual(previous.groups, descriptors, areGroupDescriptorsEqual) &&
      // The item rows are shared with the flat projection, whose cache already decides when an
      // item row is the same row; an unchanged partition over the same item rows is the same
      // projection.
      areArraysEqual(previous.rows, rows, (previousRow, nextRow) =>
        isGroupHeaderRowObject(previousRow) ? true : previousRow === nextRow,
      )
    ) {
      return previous;
    }

    const next: GroupedRows<Item> = {
      rows,
      groups: descriptors,
      itemToRowIndex,
      itemCountBeforeRow,
      rowToGroupIndex,
    };
    cacheRef.current = next;
    return next;
  }, [groups, hasGetGroupKey, itemRows, ordinalRegistry]);
}

/**
 * Whether a row id names a group header, by its reserved prefix.
 */
export function isGroupHeaderRowId(rowId: React.Key) {
  return typeof rowId === 'string' && rowId.startsWith(GROUP_HEADER_KEY_PREFIX);
}

function isGroupHeaderRowObject<Item>(row: VirtualizerRow<VirtualizerRowModel<Item>>) {
  return (row.model as { kind?: string | undefined }).kind === 'group-header';
}

function areGroupDescriptorsEqual(previous: GroupDescriptor, next: GroupDescriptor) {
  return (
    previous.key === next.key &&
    previous.ordinal === next.ordinal &&
    previous.headerRowIndex === next.headerRowIndex &&
    previous.itemStart === next.itemStart &&
    previous.itemEnd === next.itemEnd
  );
}

function areVirtualizerRowsEqual<Item>(
  previous: VirtualizerRow<VirtualizerItemRowModel<Item>>[],
  next: VirtualizerRow<VirtualizerItemRowModel<Item>>[],
) {
  return areArraysEqual(
    previous,
    next,
    (previousRow, nextRow) =>
      previousRow.id === nextRow.id &&
      previousRow.model.item === nextRow.model.item &&
      previousRow.model.itemIndex === nextRow.model.itemIndex,
  );
}

/**
 * Creates an identity registry used to generate stable keys for object and symbol item values.
 */
function createObjectKeyRegistry() {
  return {
    objectKeys: new WeakMap<object, number>(),
    symbolKeys: new Map<symbol, number>(),
    nextObjectKey: 0,
    nextSymbolKey: 0,
  };
}

function getDefaultItemKey<Value>(
  item: Value,
  registry: ReturnType<typeof createObjectKeyRegistry>,
): VirtualizerItemKey {
  if (isObjectValue(item)) {
    const objectItem = item as object;
    let key = registry.objectKeys.get(objectItem);
    if (key === undefined) {
      key = registry.nextObjectKey;
      registry.nextObjectKey += 1;
      registry.objectKeys.set(objectItem, key);
    }
    return `object:${key}`;
  }

  if (typeof item === 'symbol') {
    let key = registry.symbolKeys.get(item);
    if (key === undefined) {
      key = registry.nextSymbolKey;
      registry.nextSymbolKey += 1;
      registry.symbolKeys.set(item, key);
    }
    return `symbol:${key}`;
  }

  return normalizeItemKey(item);
}

function normalizeItemKey(key: unknown): VirtualizerItemKey {
  if (key === null) {
    return 'null';
  }
  // React coerces keys to strings, so include the primitive type before that coercion happens.
  return `${typeof key}:${String(key)}`;
}

export function isObjectValue(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}
