import { getFilter } from '../../internals/filter';
import { serializeValue, stringifyAsDefaultLabel } from '../../internals/serializeValue';
import type { ComboboxItemsPayload } from './comboboxItems';
import {
  ITEM_COLLECTION,
  type ComboboxItemsMatchOptions,
  type ItemCollection,
} from './itemCollection';

export type ComboboxItemsMatcher<Item> = (
  query: string,
  options?: ComboboxItemsMatchOptions,
) => Item[];

export interface ItemCollectionConfig<Item, Value> {
  data: readonly Item[];
  itemToValue: (item: Item) => Value;
  itemToLabel: (item: Item) => string;
  /**
   * Returns the user-provided collection-level matcher, if any. Read per call so the latest
   * matcher is used without recreating the collection.
   */
  getMatches?: (() => ComboboxItemsMatcher<Item> | undefined) | undefined;
  getLocale?: (() => Intl.LocalesArgument | undefined) | undefined;
}

export function createItemCollection<Item, Value>(
  config: ItemCollectionConfig<Item, Value>,
): ItemCollection<Item, Value> {
  const { data, itemToValue, itemToLabel, getMatches, getLocale } = config;

  // Built on first use and kept for the collection's lifetime. `useItems()` recreates the
  // collection whenever the data or accessors change.
  let valueToLabel: Map<any, string> | null = null;

  function resolveLabel(valueOrItem: any): string {
    if (valueToLabel === null) {
      valueToLabel = new Map();
      for (const item of data) {
        const value = itemToValue(item);
        if (!valueToLabel.has(value)) {
          valueToLabel.set(value, itemToLabel(item));
        }
      }
    }
    if (valueToLabel.has(valueOrItem)) {
      return valueToLabel.get(valueOrItem)!;
    }
    // Values outside the collection (e.g. creatable inputs) label as themselves.
    return serializeValue(valueOrItem);
  }

  return {
    [ITEM_COLLECTION]: true,
    data,
    itemToValue,
    itemToLabel,
    resolveLabel,
    each(callback) {
      return data.map((item, index) => callback(item, itemToValue(item), index));
    },
    matches(query, options, limit = -1) {
      if (limit === 0) {
        return [];
      }
      const customMatches = getMatches?.();
      if (customMatches) {
        const matched = customMatches(query, options);
        return limit > -1 ? matched.slice(0, limit) : matched;
      }
      if (!query) {
        return limit > -1 ? data.slice(0, limit) : data.slice();
      }
      const filter = getFilter({ locale: getLocale?.() });
      const filterFn = filter[options?.filterMode ?? 'contains'];
      const matched: Item[] = [];
      for (const item of data) {
        if (filterFn(item, query, itemToLabel)) {
          matched.push(item);
          if (matched.length === limit) {
            break;
          }
        }
      }
      return matched;
    },
    get length() {
      return data.length;
    },
    [Symbol.iterator]() {
      return data[Symbol.iterator]();
    },
  };
}

/**
 * Re-brands a serialized `Combobox.items()` payload into a collection on the client.
 */
export function collectionFromPayload<Item, Value>(
  payload: ComboboxItemsPayload<Item, Value>,
  getMatches?: (() => ComboboxItemsMatcher<Item> | undefined) | undefined,
  getLocale?: (() => Intl.LocalesArgument | undefined) | undefined,
): ItemCollection<Item, Value> {
  const { items: data, values, labels, locale } = payload;

  const indices = new Map<Item, number>();
  data.forEach((item, index) => {
    if (!indices.has(item)) {
      indices.set(item, index);
    }
  });

  return createItemCollection<Item, Value>({
    data,
    itemToValue(item) {
      const index = indices.get(item);
      return (index === undefined ? item : values[index]) as Value;
    },
    itemToLabel(item) {
      const index = indices.get(item);
      return index === undefined ? stringifyAsDefaultLabel(item) : labels[index];
    },
    getMatches,
    getLocale: () => getLocale?.() ?? locale,
  });
}
