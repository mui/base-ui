import type { Group } from '../../internals/resolveValueLabel';

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
  /**
   * Source items, preserving their flat or grouped structure for collection rendering.
   * `undefined` when the data has not loaded, which the root reads as no items prop at all.
   */
  data: readonly Item[] | readonly Group<Item>[] | undefined;
  /**
   * Projects a source item to the value used by selection APIs.
   * Absent when no `getValue` accessor was given, since the item is then its own value.
   */
  value: ((item: Item) => Value) | undefined;
  /** Whether a projected value belongs to the collection's own data. */
  hasValue: ((value: Value) => boolean) | undefined;
  /** Resolves a source item's label while filtering in the source-item domain. */
  itemLabel: (item: Item) => string;
  /**
   * Resolves a selected value's label, including values outside the mounted items.
   * `fallback` labels the values the collection cannot resolve at all.
   */
  label: (valueOrItem: Value, fallback?: ((valueOrItem: Value) => string) | undefined) => string;
}
