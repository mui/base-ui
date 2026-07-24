import { serializeValue } from '../../internals/serializeValue';
import type { Group } from '../../internals/resolveValueLabel';
import { ITEM_COLLECTION, type ItemCollection } from './itemCollection';

export interface ItemCollectionConfig<Item, Value> {
  data: readonly Item[] | readonly Group<Item>[];
  grouped: boolean;
  itemToValue: (item: Item) => Value;
  itemToLabel: (item: Item) => string;
}

export function createItemCollection<Item, Value>(
  config: ItemCollectionConfig<Item, Value>,
): ItemCollection<Item, Value> {
  const { data, grouped, itemToValue, itemToLabel } = config;

  // Grouped data flattens to its leaf items on first label request; accessors only ever
  // see leaf items.
  let leafData: readonly Item[] | null = grouped ? null : (data as readonly Item[]);

  function getLeafData(): readonly Item[] {
    if (leafData === null) {
      leafData = (data as readonly Group<Item>[]).flatMap((group) => group.items);
    }
    return leafData;
  }

  // Filled in source order as labels are requested. This preserves the root's `limit`
  // short-circuit without repeatedly scanning items.
  const valueToLabel = new Map<any, string>();
  let indexedItems = 0;

  function resolveLabel(valueOrItem: any): string {
    const leaves = getLeafData();

    while (!valueToLabel.has(valueOrItem) && indexedItems < leaves.length) {
      const item = leaves[indexedItems];
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
    grouped,
    itemToValue,
    itemToLabel,
    resolveLabel,
  };
}
