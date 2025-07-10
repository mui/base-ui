import { serializeValue } from '../../../utils/serializeValue';

export interface ComboboxGroup<Item = any> {
  /**
   * A label or value that identifies this group when required by the consumer.
   * When `Item` is an object with a `value` field, this should typically match that type;
   * however, for simple string items it can be any value.
   */
  value: unknown;
  items: Item[];
}

/**
 * The default filtering behaviour matches the stringified value of the item against the query.
 *
 * Uses the provided `itemToString` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
export function defaultItemFilter(item: any, query: string, itemToString?: (item: any) => string) {
  if (item == null) {
    return false;
  }
  return stringifyItem(item, itemToString).toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

/**
 * Enhanced filter for single selection mode that shows all items when query is empty
 * or matches the current selection, making it easier to browse options.
 */
export function singleSelectionFilter(
  item: any,
  query: string,
  itemToString?: (item: any) => string,
  selectedValue?: any,
) {
  if (item == null) {
    return false;
  }

  if (query.trim() === '') {
    return true;
  }

  const candidate = stringifyItem(item, itemToString);
  const selectedString = selectedValue != null ? stringifyItem(selectedValue, itemToString) : '';

  if (query.toLocaleLowerCase() === selectedString.toLocaleLowerCase()) {
    return true;
  }

  return candidate.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export function isGroupedItems(
  items: (any | ComboboxGroup<any>)[] | undefined,
): items is ComboboxGroup<any>[] {
  return items != null && items.length > 0 && typeof items[0] === 'object' && 'items' in items[0];
}

export function defaultGroupFilter(
  group: ComboboxGroup<any>,
  query: string,
  itemFilter: (item: any, query: string, itemToString?: (item: any) => string) => boolean,
  itemToString?: (item: any) => string,
): ComboboxGroup<any> | null {
  if (query.trim() === '') {
    return group;
  }

  const filteredItems = group.items.filter((item) => itemFilter(item, query, itemToString));

  if (filteredItems.length === 0) {
    return null;
  }

  return {
    ...group,
    items: filteredItems,
  };
}

export function stringifyItem(item: any | null | undefined, itemToString?: (item: any) => string) {
  if (itemToString && item != null) {
    return itemToString(item) ?? '';
  }
  if (item != null && typeof item === 'object' && typeof item.value === 'string') {
    return item.value;
  }
  return serializeValue(item);
}
