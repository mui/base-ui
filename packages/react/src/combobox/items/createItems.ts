import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { isGroupedItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import type { ComboboxItemCollection } from './itemCollection';

export type ComboboxPrimitiveValue = string | number | bigint | boolean;

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
   * `null` and `undefined` are reserved for no selection. Prefer stable IDs from your
   * application data.
   *
   * Receives every entry of the data array, including nullish ones, so guard inside the accessor
   * when the data can contain them.
   */
  getValue: (item: Item) => Value;
  /**
   * Projects an item to the label string that represents it in the input and, by default,
   * when matching the typed query. The root's `itemToStringLabel` prop replaces this resolver
   * and must handle every possible selected value.
   *
   * By default, the item's derived value is stringified.
   *
   * Receives every entry of the data array, including nullish ones, so guard inside the accessor
   * when the data can contain them.
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
 * Create the collection at module scope when the data is static.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @returns A collection whose selection value is the source item when `getValue` is omitted,
 * or the accessor's return value when it is provided.
 */
export function createComboboxItems<Item, Value extends ComboboxPrimitiveValue>(
  data: ComboboxItemsData<Item> | undefined,
  options: CreateComboboxItemsOptions<Item, Value>,
): ComboboxItemCollection<Item, Value>;

export function createComboboxItems<Item>(
  data: ComboboxItemsData<Item> | undefined,
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

  const resolvedData = data ?? (EMPTY_ARRAY as readonly (Item | { items: ReadonlyArray<Item> })[]);

  // Without accessors the collection would resolve every item to itself, which is exactly what
  // a plain array already does. Handing the array back keeps `items` on its original code path,
  // preserving React node labels and the null item's placeholder override.
  if (!getValue && !getLabel) {
    return resolvedData as unknown as ComboboxItemCollection<Item, Value>;
  }

  const itemToValue = getValue ?? ((item: Item) => item as unknown as Value);

  let derived: { itemValues: Map<Item, Value>; valueToItem: Map<Value, Item> } | null = null;

  // Both caches are filled by a single pass, so the accessors never run before a root consumes
  // the collection and `getValue` never runs more than once per item.
  function ensureDerived() {
    if (derived === null) {
      const itemValues = new Map<Item, Value>();
      const valueToItem = new Map<Value, Item>();

      const leafItems = isGroupedItems(resolvedData)
        ? (resolvedData as readonly Group<Item>[]).flatMap((group) => group.items)
        : (resolvedData as readonly Item[]);

      for (const item of leafItems) {
        const derivedValue = itemToValue(item);
        itemValues.set(item, derivedValue);
        // First occurrence wins, so a duplicated derived value resolves to one stable label.
        if (!valueToItem.has(derivedValue)) {
          valueToItem.set(derivedValue, item);
        }
      }

      derived = { itemValues, valueToItem };
    }

    return derived;
  }

  // The root feeds this function to memos and effects, so its identity must stay stable.
  function value(item: Item): Value {
    const { itemValues, valueToItem } = ensureDerived();
    const cachedValue = itemValues.get(item);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // Externally filtered items may be absent from the data. Cache their projection and reverse
    // lookup so selecting one preserves its label without repeating the accessor on every render.
    const derivedValue = itemToValue(item);
    itemValues.set(item, derivedValue);
    if (!valueToItem.has(derivedValue)) {
      valueToItem.set(derivedValue, item);
    }
    return derivedValue;
  }

  // Routed through the cached projection so filtering with the default label spends no extra
  // `getValue` calls.
  const itemToLabel = getLabel ?? ((item: Item) => stringifyAsLabel(value(item)));

  return {
    data: resolvedData,
    value,
    itemLabel: itemToLabel,
    label: (itemValue: Value, isItemEqualToValue?: ItemEqualityComparer<Value> | undefined) => {
      const { valueToItem } = ensureDerived();

      if (valueToItem.has(itemValue)) {
        return itemToLabel(valueToItem.get(itemValue)!);
      }

      // The exact lookup above already covers identity, so only a custom comparer can still
      // match. Skipping the scan for the default keeps the O(n) comparison off the common path.
      if (isItemEqualToValue && isItemEqualToValue !== defaultItemEquality) {
        for (const [valueToCompare, item] of valueToItem) {
          if (compareItemEquality(valueToCompare, itemValue, isItemEqualToValue)) {
            return itemToLabel(item);
          }
        }
      }

      // Without a projection, the public value is itself a source item. This preserves its label
      // when a selected object leaves the current async result window.
      if (!getValue) {
        return itemToLabel(itemValue as unknown as Item);
      }

      return stringifyAsLabel(itemValue);
    },
  } as unknown as ComboboxItemCollection<Item, Value>;
}

export type { ComboboxItemCollection } from './itemCollection';
