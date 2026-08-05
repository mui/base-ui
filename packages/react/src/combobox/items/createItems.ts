import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { error } from '@base-ui/utils/error';
import { isGroupedItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import type { ComboboxItemCollection } from './itemCollection';

export type ComboboxPrimitiveValue = string | number | bigint | boolean;

/**
 * Detects whether any constituent of `Item` may carry an `items` array, including through an
 * optional property: such an item is indistinguishable from a group at runtime, so the flat
 * form of the data must reject it.
 */
type HasGroupShape<Item> = Item extends object
  ? 'items' extends keyof Item
    ? [Extract<NonNullable<Item['items']>, ReadonlyArray<unknown>>] extends [never]
      ? never
      : true
    : never
  : never;

/**
 * Resolves to `never` when any constituent of `Item` may carry an `items` array. Applied to the
 * `data` parameter as an intersection rather than folded into `ComboboxItemsData` itself, so it
 * only validates the data after `Item` has been inferred: a conditional inside the union breaks
 * tsc's leaf-item inference for grouped data, while an intersected guard does not.
 */
type RejectGroupShapedItems<Item> = true extends HasGroupShape<Item> ? never : unknown;

/**
 * The data accepted by `createItems()`: a flat array of items, or an array of groups with items.
 */
export type ComboboxItemsData<Item> =
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
   * `null` and `undefined` are reserved for no selection. Prefer stable IDs from your
   * application data.
   *
   * Each item must derive a unique value. When two items share one, the first occurrence resolves
   * the label and every item carrying that value renders as selected.
   *
   * Nullish entries in the data are holes rather than items: they are skipped instead of being
   * passed to this accessor.
   */
  getValue: (item: Item) => Value;
  /**
   * Projects an item to the label string that represents it in the input and when matching the
   * typed query. The root's `itemToStringLabel` prop is the fallback for selected values this
   * accessor cannot reach, such as a value restored from storage whose item never appeared in
   * the data or the filtered items.
   *
   * By default, the item's derived value is stringified.
   *
   * Nullish entries in the data are holes rather than items: they are skipped instead of being
   * passed to this accessor.
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
 * `React.useMemo()` keyed on the data when it is not: a collection rebuilt on every render
 * re-derives the index of every value.
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

  // Without accessors the collection would resolve every item to itself, which is exactly what
  // a plain array already does. Handing the data back keeps `items` on its original code path,
  // preserving React node labels and the null item's placeholder override.
  if (!getValue && !getLabel) {
    return data as unknown as ComboboxItemCollection<Item, Value>;
  }

  const itemToValue = getValue ?? ((item: Item) => item as unknown as Value);

  let valueToItem: Map<Value, Item> | null = null;

  // Filled by a single pass the first time a root consumes the collection, so the accessors never
  // run before then. Only the collection's own `data` is indexed.
  function ensureDerived() {
    if (valueToItem === null) {
      const derived = new Map<Value, Item>();

      const leafItems = isGroupedItems(data)
        ? (data as readonly Group<Item>[]).flatMap((group) => group.items)
        : ((data ?? EMPTY_ARRAY) as readonly Item[]);

      for (const item of leafItems) {
        // A nullish entry is a hole in the data rather than an item, exactly as it is for a plain
        // `items` array, so it is never derived, never labeled and never rendered.
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

  // The root feeds this function to memos and effects, so its identity must stay stable.
  function value(item: Item): Value {
    if (item == null) {
      return item as unknown as Value;
    }

    // The projection is pure: the collection never stores items it does not own, so a shared
    // collection cannot be contaminated by one root's data. Items from an externally filtered
    // window are resolved and retained by each root instance instead.
    return itemToValue(item);
  }

  // Routed through the projection so the default label is exactly the item's derived value.
  const itemToLabel = getLabel ?? ((item: Item) => stringifyAsLabel(value(item)));

  return {
    // Passed through rather than defaulted, so that data which has not loaded is still the
    // absence of items rather than an empty list: the root would otherwise treat the collection
    // as an items prop that filters everything away.
    data,
    // Withheld without `getValue`: the value of an item is the item, so the root can skip
    // projecting the filtered list and keep serving `items` from the store the way a plain
    // array does, which is what preserves a null item's placeholder override.
    value: getValue ? value : undefined,
    itemLabel: itemToLabel,
    label: (itemValue: Value, fallback?: ((itemValue: Value) => string) | undefined) => {
      const derived = ensureDerived();

      if (derived.has(itemValue)) {
        return itemToLabel(derived.get(itemValue)!);
      }

      // Without a projection, the public value is itself a source item. This preserves its label
      // when a selected object leaves the current async result window.
      if (!getValue) {
        return itemToLabel(itemValue as unknown as Item);
      }

      // Only values the collection cannot resolve reach the root's `itemToStringLabel`, so it
      // covers what the data is missing instead of taking labeling over from `getLabel`.
      return stringifyAsLabel(itemValue, fallback);
    },
  } as unknown as ComboboxItemCollection<Item, Value>;
}

export type { ComboboxItemCollection } from './itemCollection';
