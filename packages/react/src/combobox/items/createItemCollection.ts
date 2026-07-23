import { getFilter } from '../../internals/filter';
import { serializeValue } from '../../internals/serializeValue';
import { defaultItemLabel, type ComboboxItemsPayload } from './comboboxItems';
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

  // Built on first use and kept for the collection's lifetime. The collection is recreated
  // whenever `data` changes, so only an accessor whose semantics change without a new data
  // array reads stale here — accessors must be pure projections of their item.
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
    // Values outside the collection (e.g. creatable inputs) label as themselves when the
    // custom label accessor can't handle them.
    const label = itemToLabel(valueOrItem);
    return label == null ? serializeValue(valueOrItem) : label;
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
    matches(query, options) {
      const customMatches = getMatches?.();
      if (customMatches) {
        return customMatches(query, options);
      }
      if (!query) {
        return data as Item[];
      }
      const filter = getFilter({ locale: getLocale?.() });
      const filterFn = filter[options?.filterMode ?? 'contains'];
      return data.filter((item) => filterFn(item, query, itemToLabel));
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
      return index === undefined ? defaultItemLabel(item) : labels[index];
    },
    getLocale: () => locale,
  });
}
