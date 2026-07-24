import type { Group } from '../../internals/resolveValueLabel';

/**
 * Normalized items created by `useItems()`, accepted by the root's `items` prop.
 */
export declare class ComboboxItemCollection<Item, Value = Item> {
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
  label: (valueOrItem: any) => string;
}
