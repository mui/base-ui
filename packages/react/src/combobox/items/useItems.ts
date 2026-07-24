'use client';
import * as React from 'react';
import { stringifyAsDefaultLabel } from '../../internals/serializeValue';
import type { ComboboxItemCollection } from './itemCollection';
import { createItemCollection } from './createItemCollection';

/**
 * Normalizes items into a collection for the root's `items` prop, deriving each item's
 * selection value and label before rendering.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function useComboboxItems<Item, Value = Item>(
  data: readonly Item[],
  options: UseComboboxItemsOptions<Item, Value> = {},
): ComboboxItemCollection<Item, Value> {
  const { value, label } = options;

  return React.useMemo(() => {
    return createItemCollection<Item, Value>({
      data,
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
   */
  value?: ((item: Item) => Value) | undefined;
  /**
   * Projects an item to the label string that represents it in the input and, by default,
   * when matching the typed query. The root's `itemToStringLabel` prop takes precedence.
   * By default, the item's derived value is stringified.
   */
  label?: ((item: Item) => string) | undefined;
}

export type { ComboboxItemCollection } from './itemCollection';
