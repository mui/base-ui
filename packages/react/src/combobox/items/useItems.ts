'use client';
import * as React from 'react';
import { getItemCollection, type ComboboxItemCollection } from './itemCollection';
import {
  collectionFromPayload,
  createItemCollection,
  type ComboboxItemsMatcher,
} from './createItemCollection';
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
  data: readonly Item[] | ComboboxItemCollection<Item, Value> | ComboboxItemsPayload<Item, Value>,
  options: UseComboboxItemsOptions<Item, Value> = {},
): ComboboxItemCollection<Item, Value> {
  return React.useMemo(() => {
    // Already normalized: pass a `useItems()` collection through unchanged and re-brand a
    // serialized `Combobox.items()` payload, whose accessors were applied when it was created.
    const collection = getItemCollection(data);
    if (collection) {
      return collection as ComboboxItemCollection<Item, Value>;
    }
    if (isItemsPayload(data)) {
      return collectionFromPayload(
        data,
        () => options.matches,
        () => options.locale,
      );
    }

    const accessors = resolveItemsAccessors(options);
    return createItemCollection<Item, Value>({
      data: data as readonly Item[],
      itemToValue: accessors.value,
      itemToLabel: accessors.label,
      getMatches: () => options.matches,
      getLocale: () => options.locale,
    });
  }, [data, options.value, options.label, options.matches, options.locale]);
}

export interface UseComboboxItemsOptions<Item, Value = Item> extends Omit<
  ComboboxItemsOptions<Item, Value>,
  'locale'
> {
  /**
   * Replaces the default query matching used by the collection's `matches()` method.
   * Returns the items that match the query.
   */
  matches?: ComboboxItemsMatcher<Item> | undefined;
  /**
   * The locale used for query matching.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export type {
  ComboboxItemCollection,
  ComboboxItemsMatchOptions,
  ComboboxItemsFilterMode,
} from './itemCollection';
