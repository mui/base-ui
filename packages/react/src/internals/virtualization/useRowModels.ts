'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { warn } from '@base-ui/utils/warn';
import type { VirtualizerItemRowModel, VirtualizerRow } from './types';

type VirtualizerItemKey = string;

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

function isObjectValue(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}
