import { error } from '@base-ui/utils/error';
import { isGroupedItems } from '../../internals/resolveValueLabel';

export type ListboxPrimitiveValue = string | number | bigint | boolean;

/**
 * A group of items in the data passed to the root's `items` prop or to `Listbox.createItems()`.
 * It can carry any other fields, such as a label to render.
 */
export interface ListboxItemGroup<Item> {
  items: readonly Item[];
}

// Accepts a group written inline with other fields, which a type without an index signature
// rejects as excess properties, as well as one declared as an `interface`, which a type with an
// index signature rejects.
export type ListboxItemGroupInput<Item> =
  ListboxItemGroup<Item> | (ListboxItemGroup<Item> & { [key: string]: unknown });

export interface CreateListboxItemsOptions<Item, Key extends ListboxPrimitiveValue> {
  /**
   * Projects an item to the primitive value that identifies it. Each item must derive a unique
   * value. Prefer stable IDs from your application data.
   *
   * Give each `Listbox.Item` this value as its `value`. The selection holds the same values.
   */
  getValue: (item: Item) => Key;
  /**
   * Projects an item to the label used for typeahead.
   */
  getLabel: (item: Item) => string;
  /**
   * Whether an item is disabled. Users can't change whether a disabled item is selected, including
   * with Ctrl/Cmd+A or a range that reaches items that aren't rendered.
   * @default () => false
   */
  getDisabled?: ((item: Item) => boolean) | undefined;
}

/**
 * A collection created by `Listbox.createItems()`. Pass it to the root's `items` prop.
 *
 * `Value` is the type `getValue` returns, which is what an item's `value` is.
 */
export declare class ListboxItemCollection<in out Item, in Value> {
  private constructor();
  private readonly __listboxItemCollectionBrand: (item: Item, value: Value) => void;
  /**
   * Returns the item with a value, or `undefined` when there's none.
   */
  get(value: Value): Item | undefined;
  /**
   * Calls a function for each item, in order, and returns the results. Use it to render the items,
   * so they stay in the collection's order. The items of grouped data are visited without their
   * groups.
   */
  map<Result>(callback: (item: Item, index: number) => Result): Result[];
}

/** The collection's internal shape, read by the listbox's parts. */
export interface ListboxItems<Item = any, Key extends ListboxPrimitiveValue = any> {
  /** How many items there are, including those that aren't rendered. */
  size: number;
  /** The item with a value. */
  get: (value: Key) => Item | undefined;
  /** The value of the item at a position. */
  valueAt: (index: number) => Key | undefined;
  /** The position of the item with a value, or `-1`. */
  indexOf: (value: unknown) => number;
  /** The label of the item at a position. */
  getLabel: (index: number) => string | null;
  /** Whether the item at a position is disabled. */
  getDisabled: (index: number) => boolean;
  /** Calls a function for each item, in order. */
  map: <Result>(callback: (item: Item, index: number) => Result) => Result[];
  /** Every item, in order, without the groups. */
  list: readonly Item[];
  /** The groups the items were passed in, or `undefined` when they weren't grouped. */
  groups: readonly ListboxItemGroup<Item>[] | undefined;
}

/**
 * Creates a collection for the root's `items` prop from data of any shape. Items are identified
 * by the value `getValue` returns, and a virtualized list reaches items that aren't rendered.
 *
 * Accepts either an array of items or an array of groups, each with an `items` array. The
 * accessors receive items, not groups. An item can't have an `items` array property, because it
 * would be read as a group.
 *
 * Create static collections at module scope, and wrap dynamic ones in `React.useMemo()` keyed by
 * their data.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 *
 * @param data The items or groups of items, or `undefined` while they are loading.
 * @param options Functions that derive each item's value, label and disabled state.
 */
export function createListboxItems<Item, Key extends ListboxPrimitiveValue>(
  data: readonly ListboxItemGroupInput<Item>[] | undefined,
  options: CreateListboxItemsOptions<Item, Key>,
): ListboxItemCollection<Item, Key>;
export function createListboxItems<Item, Key extends ListboxPrimitiveValue>(
  data: readonly Item[] | undefined,
  options: CreateListboxItemsOptions<Item, Key>,
): ListboxItemCollection<Item, Key>;
export function createListboxItems<Item, Key extends ListboxPrimitiveValue>(
  data: readonly Item[] | readonly ListboxItemGroup<Item>[] | undefined,
  options: CreateListboxItemsOptions<Item, Key>,
): ListboxItemCollection<Item, Key> {
  const { getValue, getLabel, getDisabled } = options;
  const groups = isGroupedItems(data) ? (data as readonly ListboxItemGroup<Item>[]) : undefined;
  let source: readonly Item[] = [];
  if (groups) {
    source = groups.flatMap((group) => group.items);
  } else if (data) {
    source = data as readonly Item[];
  }

  // Built on first lookup, which a list makes as soon as it renders an item, so only a collection
  // that's never rendered skips deriving every key. It's a memo of `data`, which doesn't change,
  // so filling it is idempotent.
  let indexByKey: Map<Key, number> | undefined;

  function getIndexByKey() {
    if (indexByKey) {
      return indexByKey;
    }
    indexByKey = new Map();
    for (let index = 0; index < source.length; index += 1) {
      const key = getValue(source[index]);
      // Keys should be unique. When they aren't, the first item with a key wins.
      if (!indexByKey.has(key)) {
        indexByKey.set(key, index);
      } else if (process.env.NODE_ENV !== 'production') {
        error(
          `Two items passed to createItems() derived the value ${String(key)}, so selection ` +
            'cannot tell them apart: the first item wins and every item carrying the value ' +
            'renders as selected. Return a unique value from `getValue`.',
        );
      }
    }
    return indexByKey;
  }

  function isInRange(index: number) {
    return index >= 0 && index < source.length;
  }

  function indexOf(value: unknown) {
    return getIndexByKey().get(value as Key) ?? -1;
  }

  const items: ListboxItems<Item, Key> = {
    size: source.length,
    get(value) {
      const index = indexOf(value);
      return index === -1 ? undefined : source[index];
    },
    valueAt: (index) => (isInRange(index) ? getValue(source[index]) : undefined),
    indexOf,
    getLabel: (index) => (isInRange(index) ? getLabel(source[index]) : null),
    getDisabled: (index) =>
      getDisabled != null && isInRange(index) ? getDisabled(source[index]) : false,
    map: (callback) => source.map((item, index) => callback(item, index)),
    list: source,
    groups,
  };

  return items as unknown as ListboxItemCollection<Item, Key>;
}
