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
  /** Source items, preserving their flat or grouped structure for collection rendering. */
  data: readonly Item[] | readonly Group<Item>[];
  /** Projects a source item to the value used by selection APIs. */
  value: (item: Item) => Value;
  /** Resolves a source item's label while filtering in the source-item domain. */
  itemLabel: (item: Item) => string;
  /** Resolves a selected value's label, including values outside the mounted items. */
  label: (
    valueOrItem: Value,
    isItemEqualToValue?: ItemEqualityComparer<Value> | undefined,
  ) => string;
}
