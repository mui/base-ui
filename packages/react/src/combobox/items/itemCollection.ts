import type { Group } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';

export function findCollectionItem<Item, Value>(
  valueToItem: Map<Value, Item>,
  itemValue: Value,
  isEqual: ItemEqualityComparer<Value>,
): Item | undefined {
  const exactItem = valueToItem.get(itemValue);
  if (exactItem !== undefined || isEqual === defaultItemEquality) {
    return exactItem;
  }

  for (const [derivedValue, item] of valueToItem) {
    if (compareItemEquality(derivedValue, itemValue, isEqual)) {
      return item;
    }
  }

  return undefined;
}

/**
 * An opaque collection created by `createItems()`.
 *
 * It carries the source item and derived value types so the root can infer the list item and
 * selection value types.
 *
 * Pass it directly to the root's `items` prop; it has no public members.
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
   */
  value: (item: Item) => Value;
  /** Whether a projected value belongs to the collection's own data. */
  hasValue: (value: Value, isEqual: ItemEqualityComparer<Value>) => boolean;
  /** Resolves a source item's label while filtering in the source-item domain. */
  itemLabel: (item: Item) => string;
  /**
   * Resolves a selected value's label, including values outside the mounted items.
   * `fallback` labels the values the collection cannot resolve at all.
   */
  label(
    valueOrItem: Value,
    isEqual: ItemEqualityComparer<Value>,
    fallback?: ((valueOrItem: Value) => string) | undefined,
  ): string;
}
