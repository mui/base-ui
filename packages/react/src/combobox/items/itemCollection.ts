/**
 * Brands collections created by `useItems()` so the root can tell them apart from plain
 * item arrays. This module is intentionally minimal: it is the only part of the `useItems`
 * machinery the root imports, so everything else tree-shakes for non-users.
 */
export const ITEM_COLLECTION = Symbol();

export type ComboboxItemsFilterMode = 'contains' | 'startsWith' | 'endsWith';

export interface ComboboxItemsMatchOptions {
  /**
   * How the query is matched against each item's label.
   * @default 'contains'
   */
  filterMode?: ComboboxItemsFilterMode | undefined;
}

/**
 * Normalized items created by `useItems()`, accepted by the `items` prop of `Combobox.Root`.
 */
export interface ComboboxItemCollection<Item, Value = Item> extends Iterable<Item> {
  /**
   * Maps the items to an array, calling `callback` with each item, its derived value, and
   * its index.
   */
  each<Result>(callback: (item: Item, value: Value, index: number) => Result): Result[];
  /**
   * Returns the items whose labels match the query.
   * Uses `Intl.Collator` matching by default, or the `matches` option when provided.
   */
  matches(query: string, options?: ComboboxItemsMatchOptions): Item[];
  /**
   * The number of items.
   */
  readonly length: number;
}

/**
 * Internal shape of a branded collection. The extra members let the root project items to
 * their values and resolve a selected value back to its label while items are unmounted.
 */
export interface ItemCollection<Item = any, Value = any> extends ComboboxItemCollection<
  Item,
  Value
> {
  [ITEM_COLLECTION]: true;
  data: readonly Item[];
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
