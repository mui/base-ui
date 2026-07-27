import type { Group } from '../../internals/resolveValueLabel';
import type { ItemEqualityComparer } from '../../internals/itemEquality';

/**
 * Normalized items created by `useItems()`, accepted by the root's `items` prop.
 */
export declare class ComboboxItemCollection<in out Item, Value = Item> {
  private constructor();
  private readonly __itemCollectionBrand: (item: Item) => Value;
}

/**
 * Internal shape of a collection. The extra members let the root project items to
 * their values and resolve a selected value back to its label while items are unmounted.
 */
export interface ItemCollection<Item = any, Value = any> {
  data: readonly Item[] | readonly Group<Item>[];
  value: (item: Item) => Value;
  /** Labels a source item. Used while filtering, which runs on source items. */
  itemLabel: (item: Item) => string;
  /** Labels a selected value, which may be unmounted or outside the current items. */
  label: (
    valueOrItem: Value,
    isItemEqualToValue?: ItemEqualityComparer<Value> | undefined,
  ) => string;
}
