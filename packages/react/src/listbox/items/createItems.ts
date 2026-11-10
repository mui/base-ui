import { error } from '@base-ui/utils/error';

export type ListboxPrimitiveValue = string | number | bigint | boolean;

export interface CreateListboxItemsOptions<Item, Key extends ListboxPrimitiveValue> {
  /**
   * Projects an item to the primitive key that identifies it. Each item must derive a unique key.
   * Prefer stable IDs from your application data.
   *
   * Give each `Listbox.Item` either its key or the item itself as its `value`. The selection holds
   * the same kind of value: keys, or items.
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
 * `Value` is what an item's `value` can be: its key or the item itself.
 */
// `Value` is contravariant so the root can narrow it to one kind, such as keys, from its `value`
// or `defaultValue`.
export declare class ListboxItemCollection<in out Item, in Value = Item> {
  private constructor();
  private readonly __listboxItemCollectionBrand: (item: Item, value: Value) => void;
  /**
   * Returns the item with a key, or `undefined` when there's none.
   */
  get(key: Extract<Value, ListboxPrimitiveValue>): Item | undefined;
}

/** The collection's internal shape, read by the listbox's parts. */
export interface ListboxItems<Item = any, Key extends ListboxPrimitiveValue = any> {
  /** How many items there are, including those that aren't rendered. */
  size: number;
  /** The item with a key. */
  get: (key: Key) => Item | undefined;
  /** The item at a position. */
  at: (index: number) => Item | undefined;
  /** The key of the item at a position. */
  keyAt: (index: number) => Key | undefined;
  /** The key of a value: the value itself when it's a key, or the key of an item. */
  keyOf: (value: unknown) => unknown;
  /** The position of the item with a value, which may be its key or the item itself, or `-1`. */
  indexOf: (value: unknown) => number;
  /** The label of the item at a position. */
  getLabel: (index: number) => string | null;
  /** Whether the item at a position is disabled. */
  getDisabled: (index: number) => boolean;
}

/** Whether a value is an item rather than a key. */
export function isItemValue(value: unknown) {
  return typeof value === 'object' && value !== null;
}

/**
 * Creates a collection for the root's `items` prop from data that isn't strings or numbers. Items
 * are matched by the key `getValue` returns, and a virtualized list reaches items that aren't
 * rendered.
 *
 * Create static collections at module scope, and wrap dynamic ones in `React.useMemo()` keyed by
 * their data.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 *
 * @param data The items, or `undefined` while they are loading.
 * @param options Functions that derive each item's key, label and disabled state.
 */
export function createListboxItems<Item, Key extends ListboxPrimitiveValue>(
  data: readonly Item[] | undefined,
  options: CreateListboxItemsOptions<Item, Key>,
): ListboxItemCollection<Item, Key | Item> {
  const { getValue, getLabel, getDisabled } = options;
  const source = data ?? [];

  // Built on first lookup rather than upfront, so a large list that's only scrolled never derives
  // every key. It's a memo of `data`, which doesn't change, so filling it is idempotent.
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

  function keyOf(value: unknown) {
    return isItemValue(value) ? getValue(value as Item) : value;
  }

  function indexOf(value: unknown) {
    return getIndexByKey().get(keyOf(value) as Key) ?? -1;
  }

  const items: ListboxItems<Item, Key> = {
    size: source.length,
    get(key) {
      const index = indexOf(key);
      return index === -1 ? undefined : source[index];
    },
    at: (index) => (isInRange(index) ? source[index] : undefined),
    keyAt: (index) => (isInRange(index) ? getValue(source[index]) : undefined),
    keyOf,
    indexOf,
    getLabel: (index) => (isInRange(index) ? getLabel(source[index]) : null),
    getDisabled: (index) =>
      getDisabled != null && isInRange(index) ? getDisabled(source[index]) : false,
  };

  return items as unknown as ListboxItemCollection<Item, Key | Item>;
}
