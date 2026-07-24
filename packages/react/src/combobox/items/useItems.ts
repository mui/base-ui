'use client';
import * as React from 'react';
import type { ComboboxItemCollection } from './itemCollection';
import { collectionFromPayload, createItemCollection } from './createItemCollection';
import {
  isItemsPayload,
  resolveItemsAccessors,
  type ComboboxItemsOptions,
  type ComboboxItemsPayload,
} from './comboboxItems';

/**
 * Normalizes items into a collection for the root's `items` prop, deriving each item's
 * selection value and label before rendering.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function useComboboxItems<Item, Value = Item>(
  data: readonly Item[],
  options?: UseComboboxItemsOptions<Item, Value>,
): ComboboxItemCollection<Item, Value>;
export function useComboboxItems<Item, Value = Item>(
  data: ComboboxItemsPayload<Item, Value>,
): ComboboxItemCollection<Item, Value>;
export function useComboboxItems<Item, Value = Item>(
  data: readonly Item[] | ComboboxItemsPayload<Item, Value>,
  options: UseComboboxItemsOptions<Item, Value> = {},
): ComboboxItemCollection<Item, Value> {
  const { value, label } = options;

  return React.useMemo(() => {
    if (isItemsPayload(data)) {
      return collectionFromPayload(data);
    }

    const accessors = resolveItemsAccessors({ value, label });
    return createItemCollection<Item, Value>({
      data: data as readonly Item[],
      itemToValue: accessors.value,
      itemToLabel: accessors.label,
    });
  }, [data, value, label]) as unknown as ComboboxItemCollection<Item, Value>;
}

export interface UseComboboxItemsOptions<Item, Value = Item> extends ComboboxItemsOptions<
  Item,
  Value
> {}

export type { ComboboxItemCollection } from './itemCollection';
