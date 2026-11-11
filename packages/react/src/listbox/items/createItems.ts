import { error } from '@base-ui/utils/error';

export type ListboxPrimitiveValue = string | number | bigint | boolean;

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
}

/**
 * Creates a collection for the root's `items` prop from data that isn't strings or numbers. Items
 * are identified by the value `getValue` returns, and a virtualized list reaches items that aren't
 * rendered.
 *
 * Create static collections at module scope, and wrap dynamic ones in `React.useMemo()` keyed by
 * their data.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 *
 * @param data The items, or `undefined` while they are loading.
 * @param options Functions that derive each item's value, label and disabled state.
 */
export function createListboxItems<Item, Key extends ListboxPrimitiveValue>(
  data: readonly Item[] | undefined,
  options: CreateListboxItemsOptions<Item, Key>,
): ListboxItemCollection<Item, Key> {
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
  };

  return items as unknown as ListboxItemCollection<Item, Key>;
}
