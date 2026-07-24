import { serializeValue, stringifyAsDefaultLabel } from '../../internals/serializeValue';
import type { ItemsPayload } from './comboboxItems';
import { ITEM_COLLECTION, type ItemCollection } from './itemCollection';

export interface ItemCollectionConfig<Item, Value> {
  data: readonly Item[];
  itemToValue: (item: Item) => Value;
  itemToLabel: (item: Item) => string;
}

export function createItemCollection<Item, Value>(
  config: ItemCollectionConfig<Item, Value>,
): ItemCollection<Item, Value> {
  const { data, itemToValue, itemToLabel } = config;

  // Filled in source order as labels are requested. This preserves the root's `limit`
  // short-circuit without repeatedly scanning items.
  const valueToLabel = new Map<any, string>();
  let indexedItems = 0;

  function resolveLabel(valueOrItem: any): string {
    while (!valueToLabel.has(valueOrItem) && indexedItems < data.length) {
      const item = data[indexedItems];
      indexedItems += 1;
      const value = itemToValue(item);
      if (!valueToLabel.has(value)) {
        valueToLabel.set(value, itemToLabel(item));
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
  };
}

/**
 * Re-brands a serialized `Combobox.items()` payload into a collection on the client.
 */
export function collectionFromPayload<Item, Value>(
  payload: ItemsPayload<Item, Value>,
): ItemCollection<Item, Value> {
  const { items: data, values, labels } = payload;

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
  });
}
