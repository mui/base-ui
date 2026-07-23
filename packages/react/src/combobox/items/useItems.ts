'use client';
import * as React from 'react';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
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
 * Normalizes items into a collection for `Combobox.Root`'s `items` prop, deriving each item's
 * selection value and label before rendering.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function useComboboxItems<Item, Value = Item>(
  data: readonly Item[] | ComboboxItemCollection<Item, Value> | ComboboxItemsPayload<Item, Value>,
  options: UseComboboxItemsOptions<Item, Value> = {},
): ComboboxItemCollection<Item, Value> {
  const accessors = resolveItemsAccessors(options);

  // The collection reads the accessors through refs so inline functions don't recreate it
  // every render. The refs sync in a layout effect, so an accessor is stale for the render
  // it changes in — acceptable because accessors must be pure projections of their item.
  const valueRef = useValueAsRef(accessors.value);
  const labelRef = useValueAsRef(accessors.label);
  const matchesRef = useValueAsRef(options.matches);
  const localeRef = useValueAsRef(options.locale);

  return React.useMemo(() => {
    // Already normalized: pass a `useItems()` collection through unchanged and re-brand a
    // serialized `Combobox.items()` payload, whose accessors were applied when it was created.
    const collection = getItemCollection(data);
    if (collection) {
      return collection as ComboboxItemCollection<Item, Value>;
    }
    if (isItemsPayload(data)) {
      return collectionFromPayload(data);
    }

    return createItemCollection<Item, Value>({
      data: data as readonly Item[],
      itemToValue: (item) => valueRef.current(item),
      itemToLabel: (item) => labelRef.current(item),
      getMatches: () => matchesRef.current,
      getLocale: () => localeRef.current,
    });
    // The refs are stable; only `data` identity recreates the collection.
  }, [data, valueRef, labelRef, matchesRef, localeRef]);
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
