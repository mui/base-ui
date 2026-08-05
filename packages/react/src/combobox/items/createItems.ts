import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { error } from '@base-ui/utils/error';
import { isGroupedItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import type { ComboboxItemCollection } from './itemCollection';

export type ComboboxPrimitiveValue = string | number | bigint | boolean;

/** Whether any constituent of `Item` may carry an `items` array, including optionally. */
type HasGroupShape<Item> = Item extends object
  ? 'items' extends keyof Item
    ? [Extract<NonNullable<Item['items']>, ReadonlyArray<unknown>>] extends [never]
      ? never[] extends NonNullable<Item['items']>
        ? true
        : never
      : true
    : never
  : never;

type IsAny<T> = 0 extends 1 & T ? true : false;

// `any` opts out so loosely typed data stays usable.
type RejectGroupShapedItems<Item> =
  IsAny<Item> extends true ? unknown : true extends HasGroupShape<Item> ? never : unknown;

// The group-shape guard stays outside this union because folding it in breaks tsc's leaf-item
// inference for grouped data.
type ComboboxItemsData<Item> =
  | (Extract<Item, { items: ReadonlyArray<unknown> }> extends never ? readonly Item[] : never)
  | readonly { items: ReadonlyArray<Item> }[];

interface CreateComboboxItemsIdentityOptions<Item> {
  getValue?: undefined;
  getLabel?: ((item: Item) => string) | undefined;
}

export interface CreateComboboxItemsOptions<
  Item,
  Value extends ComboboxPrimitiveValue = ComboboxPrimitiveValue,
> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   *
   * `null` and `undefined` are reserved for no selection, and each item must derive a unique
   * value. Prefer stable IDs from your application data.
   *
   * Nullish entries in the data are holes rather than items: they are never passed to this
   * accessor.
   */
  getValue: (item: Item) => Value;
  /**
   * Projects an item to the label string that represents it in the input and when matching the
   * typed query. The root's `itemToStringLabel` prop is the fallback for values whose item is in
   * neither the data nor the current `filteredItems`.
   *
   * By default, the item's derived value is stringified.
   */
  getLabel?: ((item: Item) => string) | undefined;
}

/**
 * Normalizes items into a collection for the root's `items` prop, deriving each item's
 * selection value and label when a root first consumes the collection.
 * Accepts a flat array of items or an array of groups with items; the `getValue` and `getLabel`
 * accessors always receive individual items, never groups.
 * An item must not itself have an `items` array property: such an entry is read as a group,
 * both in the types and at runtime.
 * Create the collection at module scope when the data is static, and wrap it in
 * `React.useMemo()` keyed on the data when it is not.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @returns A collection whose selection value is the source item when `getValue` is omitted,
 * or the accessor's return value when it is provided.
 */
export function createComboboxItems<Item, Value extends ComboboxPrimitiveValue>(
  data: (ComboboxItemsData<Item> & RejectGroupShapedItems<Item>) | undefined,
  options: CreateComboboxItemsOptions<Item, Value>,
): ComboboxItemCollection<Item, Value>;

export function createComboboxItems<Item>(
  data: (ComboboxItemsData<Item> & RejectGroupShapedItems<Item>) | undefined,
  options?: CreateComboboxItemsIdentityOptions<Item>,
): ComboboxItemCollection<Item, Item>;

export function createComboboxItems<Item, Value>(
  data: readonly (Item | { items: ReadonlyArray<Item> })[] | undefined,
  options: {
    getValue?: ((item: Item) => Value) | undefined;
    getLabel?: ((item: Item) => string) | undefined;
  } = {},
): ComboboxItemCollection<Item, Value> {
  const { getValue, getLabel } = options;

  // Without accessors every item resolves to itself, which is what a plain array already does.
  if (!getValue && !getLabel) {
    return data as unknown as ComboboxItemCollection<Item, Value>;
  }

  const itemToValue = getValue ?? ((item: Item) => item as unknown as Value);

  let valueToItem: Map<Value, Item> | null = null;

  // Lazily indexes the collection's own `data`, so the accessors never run at creation.
  function ensureDerived() {
    if (valueToItem === null) {
      const derived = new Map<Value, Item>();

      const leafItems = isGroupedItems(data)
        ? (data as readonly Group<Item>[]).flatMap((group) => group.items)
        : ((data ?? EMPTY_ARRAY) as readonly Item[]);

      for (const item of leafItems) {
        // Nullish entries are holes in the data, as they are for a plain `items` array.
        if (item == null) {
          continue;
        }

        const derivedValue = itemToValue(item);
        // First occurrence wins, so a duplicated derived value resolves to one stable label.
        if (!derived.has(derivedValue)) {
          derived.set(derivedValue, item);
        } else if (process.env.NODE_ENV !== 'production') {
          error(
            'Two items passed to createItems() derived the same value, so selection and label ' +
              'resolution cannot tell them apart: the first item wins the label and every item ' +
              'carrying the value renders as selected. Return a unique value from `getValue`.',
          );
        }
      }

      valueToItem = derived;
    }

    return valueToItem;
  }

  // A pure projection with stable identity: the root feeds it to memos and effects, and the
  // collection never stores items it does not own.
  function value(item: Item): Value {
    if (item == null) {
      return item as unknown as Value;
    }
    return itemToValue(item);
  }

  const itemToLabel = getLabel ?? ((item: Item) => stringifyAsLabel(value(item)));

  return {
    // Passed through rather than defaulted: data that has not loaded must stay the absence of
    // items rather than an empty list that filters everything away.
    data,
    // Withheld without `getValue` so the root keeps serving `items` the way a plain array does.
    value: getValue ? value : undefined,
    itemLabel: itemToLabel,
    label: (itemValue: Value, fallback?: ((itemValue: Value) => string) | undefined) => {
      const derived = ensureDerived();

      if (derived.has(itemValue)) {
        return itemToLabel(derived.get(itemValue)!);
      }

      // Without a projection, the public value is itself a source item.
      if (!getValue) {
        return itemToLabel(itemValue as unknown as Item);
      }

      return stringifyAsLabel(itemValue, fallback);
    },
  } as unknown as ComboboxItemCollection<Item, Value>;
}

export type { ComboboxItemCollection } from './itemCollection';
