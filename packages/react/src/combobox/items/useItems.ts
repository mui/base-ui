'use client';
import * as React from 'react';
import { isGroupedItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import type { ComboboxItemCollection } from './itemCollection';

/**
 * Resolves the individual item type of a `useItems()` data array: the group's item type when
 * the array is grouped, otherwise the array element itself.
 */
export type ComboboxCollectionItem<ItemOrGroup> = ItemOrGroup extends {
  items: ReadonlyArray<infer Item>;
}
  ? Item
  : ItemOrGroup;

/**
 * Normalizes items into a collection for the root's `items` prop, deriving each item's
 * selection value and label before rendering.
 * Accepts a flat array of items or an array of groups with items; the `value` and `label`
 * accessors always receive individual items, never groups.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function useComboboxItems<ItemOrGroup, Value = ComboboxCollectionItem<ItemOrGroup>>(
  data: readonly ItemOrGroup[],
  options: UseComboboxItemsOptions<ComboboxCollectionItem<ItemOrGroup>, Value> = {},
): ComboboxItemCollection<ComboboxCollectionItem<ItemOrGroup>, Value> {
  type Item = ComboboxCollectionItem<ItemOrGroup>;
  const { value, label } = options;

  return React.useMemo(() => {
    const itemToValue = value ?? ((item: Item) => item as unknown as Value);
    const itemToLabel = label ?? ((item: Item) => stringifyAsLabel(itemToValue(item)));
    const leafItems = isGroupedItems(data)
      ? (data as readonly Group<Item>[]).flatMap((group) => group.items)
      : (data as readonly Item[]);
    const labels = new Map<Value, string>();
    let indexedItems = 0;

    return {
      data,
      value: itemToValue,
      label: (itemValue: Value) => {
        while (!labels.has(itemValue) && indexedItems < leafItems.length) {
          const item = leafItems[indexedItems];
          indexedItems += 1;
          labels.set(itemToValue(item), itemToLabel(item));
        }
        return labels.get(itemValue) ?? stringifyAsLabel(itemValue);
      },
    };
  }, [data, value, label]) as unknown as ComboboxItemCollection<Item, Value>;
}

export interface UseComboboxItemsOptions<Item, Value = Item> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   * By default, the item itself is used as the value.
   * `null` and `undefined` are reserved for no selection.
   * Keep this function reference stable to preserve collection memoization.
   */
  value?: ((item: Item) => Value) | undefined;
  /**
   * Projects an item to the label string that represents it in the input and, by default,
   * when matching the typed query. The root's `itemToStringLabel` prop takes precedence.
   * By default, the item's derived value is stringified.
   * Keep this function reference stable to preserve collection memoization.
   */
  label?: ((item: Item) => string) | undefined;
}

export type { ComboboxItemCollection } from './itemCollection';
