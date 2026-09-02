import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { error } from '@base-ui/utils/error';
import {
  flattenLeafItems,
  removeNullishItems,
  stringifyAsLabel,
} from '../../internals/resolveValueLabel';
import type { ItemEqualityComparer } from '../../internals/itemEquality';
import { findCollectionItem, type ComboboxItemCollection } from './itemCollection';

export type ComboboxPrimitiveValue = string | number | bigint | boolean;

type RemoveIndexSignature<Type> = {
  [
    Key in keyof Type as string extends Key
      ? never
      : number extends Key
        ? never
        : symbol extends Key
          ? never
          : Key
  ]: Type[Key];
};

/** Whether any constituent of `Item` explicitly declares an `items` field that may be an array. */
type HasGroupShape<Item> = Item extends object
  ? 'items' extends keyof RemoveIndexSignature<Item>
    ? [Extract<NonNullable<Item['items']>, ReadonlyArray<unknown>>] extends [never]
      ? never[] extends NonNullable<Item['items']>
        ? true
        : never
      : true
    : never
  : never;

type IsAny<T> = 0 extends 1 & T ? true : false;

type GroupShapedItemsError =
  'Base UI: items passed to createItems() cannot have an `items` array property because it marks a group. Rename the field or cast the data.';

type RejectGroupShapedItems<Item> =
  IsAny<Item> extends true
    ? unknown
    : true extends HasGroupShape<Item>
      ? GroupShapedItemsError
      : unknown;

// The group-shape guard stays outside this union because folding it in breaks tsc's leaf-item
// inference for grouped data.
type ComboboxItemsData<Item> =
  | (Extract<Item, { items: ReadonlyArray<unknown> }> extends never ? readonly Item[] : never)
  | readonly { items: ReadonlyArray<Item> }[];

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
   */
  getLabel: (item: Item) => string;
}

/**
 * Creates a collection for the root's `items` prop. Values and labels are derived on first use.
 *
 * Accepts either a flat item array or an array of groups. The `getValue` and `getLabel` accessors
 * receive items, not groups.
 *
 * Items cannot have an `items` array property because they would be interpreted as groups.
 * Rename that field or cast the data when the runtime values are known not to contain arrays.
 *
 * Create static collections at module scope. Wrap dynamic collections in `React.useMemo()` keyed
 * by their data.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param data The flat or grouped source items, or `undefined` while they are loading.
 * @param options Functions that derive each source item's selection value and display label.
 * @returns A collection whose selection value is the `getValue` accessor's return value.
 */
export function createComboboxItems<Item, Value extends ComboboxPrimitiveValue>(
  data: (ComboboxItemsData<Item> & RejectGroupShapedItems<Item>) | undefined,
  options: CreateComboboxItemsOptions<Item, Value>,
): ComboboxItemCollection<Item, Value> {
  const { getValue, getLabel } = options;

  let valueToItem: Map<Value, Item> | null = null;

  // Lazily indexes the collection's own `data`, so the accessors never run at creation.
  function ensureDerived() {
    if (valueToItem === null) {
      const derived = new Map<Value, Item>();

      // Nullish entries are holes in the data, as they are for a plain `items` array. The root
      // drops them from what it renders, and the index drops them from what it labels.
      const leafItems = data ? flattenLeafItems<Item>(removeNullishItems(data)) : EMPTY_ARRAY;

      for (const item of leafItems) {
        const derivedValue = getValue(item);
        // First occurrence wins, so a duplicated derived value resolves to one stable label.
        if (!derived.has(derivedValue)) {
          derived.set(derivedValue, item);
        } else if (process.env.NODE_ENV !== 'production') {
          error(
            `Two items passed to createItems() derived the value ${String(derivedValue)}, so selection and label ` +
              'resolution cannot tell them apart: the first item wins the label and every item ' +
              'carrying the value renders as selected. Return a unique value from `getValue`.',
          );
        }
      }

      valueToItem = derived;
    }

    return valueToItem;
  }

  return {
    // Passed through rather than defaulted: data that has not loaded must stay the absence of
    // items rather than an empty list that filters everything away.
    data,
    // Pure projections with stable identity: the root feeds them to memos and effects, and the
    // collection never stores items it does not own. They are unguarded because the root drops
    // nullish holes before projecting, so they only ever receive real items.
    value: getValue,
    itemLabel: getLabel,
    hasValue(itemValue: Value, isEqual: ItemEqualityComparer<Value>) {
      return findCollectionItem(ensureDerived(), itemValue, isEqual) !== undefined;
    },
    label(
      itemValue: Value,
      isEqual: ItemEqualityComparer<Value>,
      fallback?: ((itemValue: Value) => string) | undefined,
    ) {
      const item = findCollectionItem(ensureDerived(), itemValue, isEqual);
      if (item !== undefined) {
        return getLabel(item);
      }

      return stringifyAsLabel(itemValue, fallback);
    },
  } as unknown as ComboboxItemCollection<Item, Value>;
}
