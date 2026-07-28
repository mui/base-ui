'use client';
import * as React from 'react';
import { isGroupedItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import type { ComboboxItemCollection } from './itemCollection';

/**
 * Resolves the individual item type of a `useItems()` data array: the group's item type when
 * the array is grouped, otherwise the array element itself.
 */
type ComboboxCollectionItem<ItemOrGroup> = ItemOrGroup extends {
  items: ReadonlyArray<infer Item>;
}
  ? Item
  : ItemOrGroup;

/**
 * Normalizes items into a collection for the root's `items` prop, deriving each item's
 * selection value and label before rendering.
 * Accepts a flat array of items or an array of groups with items; the `getValue` and `getLabel`
 * accessors always receive individual items, never groups.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @returns A collection whose selection value is the source item when `getValue` is omitted,
 * or the accessor's return value when it is provided.
 */
export function useComboboxItems<Item, Value extends ComboboxPrimitiveValue = never>(
  data: readonly (Item | { items: ReadonlyArray<Item> })[],
  options?: UseComboboxItemsOptions<Item, Value>,
): ComboboxItemCollection<Item, [Value] extends [never] ? Item : Value>;

export function useComboboxItems<ItemOrGroup, Value>(
  data: readonly ItemOrGroup[],
  options: UseComboboxItemsOptions<ComboboxCollectionItem<ItemOrGroup>, Value> = {},
): ComboboxItemCollection<ComboboxCollectionItem<ItemOrGroup>, Value> {
  type Item = ComboboxCollectionItem<ItemOrGroup>;
  const { getValue, getLabel } = options;

  return React.useMemo(() => {
    // Without accessors the collection would resolve every item to itself, which is exactly what
    // a plain array already does. Handing the array back keeps `items` on its original code path,
    // preserving React node labels and the null item's placeholder override.
    if (!getValue && !getLabel) {
      return data;
    }

    const itemToValue = getValue ?? ((item: Item) => item as unknown as Value);
    const itemToLabel = getLabel ?? ((item: Item) => stringifyAsLabel(itemToValue(item)));
    const leafItems = isGroupedItems(data)
      ? (data as readonly Group<Item>[]).flatMap((group) => group.items)
      : (data as readonly Item[]);
    const labels = new Map<Value, string>();
    let indexedItems = 0;

    return {
      data,
      value: itemToValue,
      itemLabel: itemToLabel,
      label: (itemValue: Value, isItemEqualToValue?: ItemEqualityComparer<Value> | undefined) => {
        while (!labels.has(itemValue) && indexedItems < leafItems.length) {
          const item = leafItems[indexedItems];
          indexedItems += 1;
          const derivedValue = itemToValue(item);
          // First occurrence wins, so a duplicated derived value resolves to one stable label
          // rather than one that depends on how far the lazy index happened to advance.
          if (!labels.has(derivedValue)) {
            labels.set(derivedValue, itemToLabel(item));
          }
        }

        const exactLabel = labels.get(itemValue);
        if (exactLabel !== undefined) {
          return exactLabel;
        }

        // The exact lookup above already covers identity, so only a custom comparer can still
        // match. Skipping the scan for the default keeps a missing value off an O(n) path that
        // runs on every render.
        if (isItemEqualToValue && isItemEqualToValue !== defaultItemEquality) {
          for (const [valueToCompare, itemLabel] of labels) {
            if (compareItemEquality(valueToCompare, itemValue, isItemEqualToValue)) {
              return itemLabel;
            }
          }
        }

        return stringifyAsLabel(itemValue);
      },
    };
  }, [data, getValue, getLabel]) as unknown as ComboboxItemCollection<Item, Value>;
}

export type ComboboxPrimitiveValue = string | number | bigint | boolean | symbol;

export interface UseComboboxItemsOptions<Item, Value = Item> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   * By default, the item itself is used as the value.
   * `null` and `undefined` are reserved for no selection.
   * Prefer stable IDs from your application data.
   * Keep this function reference stable to preserve collection memoization.
   */
  getValue?: ((item: Item) => Value) | undefined;
  /**
   * Projects an item to the label string that represents it in the input and, by default,
   * when matching the typed query. The root's `itemToStringLabel` prop replaces this resolver
   * and must handle every possible selected value.
   * By default, the item's derived value is stringified.
   * Keep this function reference stable to preserve collection memoization.
   */
  getLabel?: ((item: Item) => string) | undefined;
}

export type { ComboboxItemCollection } from './itemCollection';
