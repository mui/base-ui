import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { isGroupedItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import type { ComboboxItemCollection } from './itemCollection';

/**
 * Resolves the individual item type of a `createItems()` data array: the group's item type when
 * the array is grouped, otherwise the array element itself.
 */
type ComboboxCollectionItem<ItemOrGroup> = ItemOrGroup extends {
  items: ReadonlyArray<infer Item>;
}
  ? Item
  : ItemOrGroup;

/**
 * Normalizes items into a collection for the root's `items` prop, deriving each item's
 * selection value and label before rendering.
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
export function createComboboxItems<Item, Value extends ComboboxPrimitiveValue = never>(
  data: readonly (Item | { items: ReadonlyArray<Item> })[] | undefined,
  options?: CreateComboboxItemsOptions<Item, Value>,
): ComboboxItemCollection<Item, [Value] extends [never] ? Item : Value>;

export function createComboboxItems<ItemOrGroup, Value>(
  data: readonly ItemOrGroup[] | undefined,
  options: CreateComboboxItemsOptions<ComboboxCollectionItem<ItemOrGroup>, Value> = {},
): ComboboxItemCollection<ComboboxCollectionItem<ItemOrGroup>, Value> {
  type Item = ComboboxCollectionItem<ItemOrGroup>;
  const { getValue, getLabel } = options;

  const resolvedData = data ?? (EMPTY_ARRAY as readonly ItemOrGroup[]);

  // Without accessors the collection would resolve every item to itself, which is exactly what
  // a plain array already does. Handing the array back keeps `items` on its original code path,
  // preserving React node labels and the null item's placeholder override.
  if (!getValue && !getLabel) {
    return resolvedData as unknown as ComboboxItemCollection<Item, Value>;
  }

  const itemToValue = getValue ?? ((item: Item) => item as unknown as Value);
  const itemToLabel = getLabel ?? ((item: Item) => stringifyAsLabel(itemToValue(item)));
  const leafItems = isGroupedItems(resolvedData)
    ? (resolvedData as readonly Group<Item>[]).flatMap((group) => group.items)
    : (resolvedData as readonly Item[]);
  const labels = new Map<Value, string>();
  for (const item of leafItems) {
    const derivedValue = itemToValue(item);
    // First occurrence wins, so a duplicated derived value resolves to one stable label.
    if (!labels.has(derivedValue)) {
      labels.set(derivedValue, itemToLabel(item));
    }
  }

  return {
    data: resolvedData,
    value: itemToValue,
    itemLabel: itemToLabel,
    label: (itemValue: Value, isItemEqualToValue?: ItemEqualityComparer<Value> | undefined) => {
      const exactLabel = labels.get(itemValue);
      if (exactLabel !== undefined) {
        return exactLabel;
      }

      // The exact lookup above already covers identity, so only a custom comparer can still
      // match. Skipping the scan for the default keeps the O(n) comparison off the common path.
      if (isItemEqualToValue && isItemEqualToValue !== defaultItemEquality) {
        for (const [valueToCompare, itemLabel] of labels) {
          if (compareItemEquality(valueToCompare, itemValue, isItemEqualToValue)) {
            return itemLabel;
          }
        }
      }

      return stringifyAsLabel(itemValue);
    },
  } as unknown as ComboboxItemCollection<Item, Value>;
}

export type ComboboxPrimitiveValue = string | number | bigint | boolean | symbol;

export interface CreateComboboxItemsOptions<Item, Value = Item> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   * By default, the item itself is used as the value.
   * `null` and `undefined` are reserved for no selection.
   * Prefer stable IDs from your application data.
   * Receives every entry of the data array, including nullish ones, so guard inside the accessor
   * when the data can contain them.
   */
  getValue?: ((item: Item) => Value) | undefined;
  /**
   * Projects an item to the label string that represents it in the input and, by default,
   * when matching the typed query. The root's `itemToStringLabel` prop replaces this resolver
   * and must handle every possible selected value.
   * By default, the item's derived value is stringified.
   * Receives every entry of the data array, including nullish ones, so guard inside the accessor
   * when the data can contain them.
   */
  getLabel?: ((item: Item) => string) | undefined;
}

export type { ComboboxItemCollection } from './itemCollection';
