import { serializeValue } from '../../../utils/serializeValue';

export interface ComboboxGroup {
  /**
   * A label or value that identifies this group when required by the consumer.
   * When `Item` is an object with a `value` field, this should typically match that type;
   * however, for simple string items it can be any value.
   */
  value: unknown;
  items: any[];
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

  let candidate: string;

  if (itemToString) {
    candidate = itemToString(item);
  } else {
    let value: unknown = item;

    if (typeof item === 'object' && 'value' in (item as any)) {
      value = (item as any).value;
    }

    candidate = String(value);
  }

  return candidate.toLowerCase().includes(query);
}

export function isGroupedItems(
  items: (any | ComboboxGroup)[] | undefined,
): items is ComboboxGroup[] {
  return (
    items != null &&
    items.length > 0 &&
    typeof items[0] === 'object' &&
    'items' in (items[0] as any)
  );
}

export function defaultGroupFilter(
  group: ComboboxGroup,
  query: string,
  itemFilter: (item: any, query: string, itemToString?: (item: any) => string) => boolean,
  itemToString?: (item: any) => string,
): ComboboxGroup | null {
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

export function getFormValue(value: any, itemToValue?: (item: any) => string) {
  if (itemToValue && value != null) {
    return itemToValue(value) ?? '';
  }
  return serializeValue(value);
}

export function getItemString(item: any, itemToString?: (item: any) => string) {
  if (itemToString && item != null) {
    return itemToString(item) ?? '';
  }
  return serializeValue(item);
}
