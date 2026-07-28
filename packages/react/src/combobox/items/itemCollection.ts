import type { Group } from '../../internals/resolveValueLabel';
import type { ItemEqualityComparer } from '../../internals/itemEquality';

/**
 * An opaque handle to the normalized items created by `createItems()`.
 * It carries the source item type and the derived value type, which is how the root infers what
 * the list renders and what selection receives. It exposes no members of its own: the only valid
 * use is passing it to the root's `items` prop.
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
