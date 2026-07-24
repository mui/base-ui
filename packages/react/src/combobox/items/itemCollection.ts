import type { Group } from '../../internals/resolveValueLabel';

/**
 * Brands collections created by `useItems()` so the root can tell them apart from plain
 * item arrays. This module is intentionally minimal: it is the only part of the `useItems`
 * machinery the root imports, so everything else tree-shakes for non-users.
 */
export const ITEM_COLLECTION = Symbol();

/**
 * Normalized items created by `useItems()`, accepted by the root's `items` prop.
 */
export declare class ComboboxItemCollection<Item, Value = Item> {
  private constructor();
  private readonly __itemCollectionBrand: (item: Item) => Value;
}

/**
 * Internal shape of a branded collection. The extra members let the root project items to
 * their values and resolve a selected value back to its label while items are unmounted.
 */
export interface ItemCollection<Item = any, Value = any> {
  [ITEM_COLLECTION]: true;
  data: readonly Item[] | readonly Group<Item>[];
  grouped: boolean;
  itemToValue: (item: Item) => Value;
  itemToLabel: (item: Item) => string;
  resolveLabel: (valueOrItem: any) => string;
}

/**
 * Returns the `items` prop as a branded `useItems()` collection, or `null` for plain arrays.
 */
export function getItemCollection(items: unknown): ItemCollection | null {
  if (
    typeof items === 'object' &&
    items !== null &&
    (items as ItemCollection)[ITEM_COLLECTION] === true
  ) {
    return items as ItemCollection;
  }
  return null;
}
