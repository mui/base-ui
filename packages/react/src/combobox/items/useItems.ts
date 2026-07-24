'use client';
import * as React from 'react';
import { stringifyAsDefaultLabel } from '../../internals/serializeValue';
import { isGroupedItems } from '../../internals/resolveValueLabel';
import type { ComboboxItemCollection } from './itemCollection';
import { createItemCollection } from './createItemCollection';

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
    return createItemCollection<Item, Value>({
      data: data as readonly Item[],
      // Same shape detection as the root's `items` prop.
      grouped: isGroupedItems(data),
      itemToValue: value ?? ((item: Item) => item as unknown as Value),
      itemToLabel:
        label ??
        ((item: Item) => stringifyAsDefaultLabel(value ? value(item) : (item as unknown as Value))),
    });
  }, [data, value, label]) as unknown as ComboboxItemCollection<Item, Value>;
}

export interface UseComboboxItemsOptions<Item, Value = Item> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   * By default, the item itself is used as the value.
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
