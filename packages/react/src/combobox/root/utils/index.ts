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

  // Show all items when query is empty
  if (query.trim() === '') {
    return true;
  }

  // Get the string representation of the item
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

  // Get the string representation of the selected value
  let selectedString = '';
  if (selectedValue != null) {
    if (itemToString) {
      selectedString = itemToString(selectedValue);
    } else {
      let value: unknown = selectedValue;
      if (typeof selectedValue === 'object' && 'value' in (selectedValue as any)) {
        value = (selectedValue as any).value;
      }
      selectedString = String(value);
    }
  }

  // Show all items when query matches current selection
  if (query.toLowerCase() === selectedString.toLowerCase()) {
    return true;
  }

  // Otherwise, use standard filtering
  return candidate.toLowerCase().includes(query.toLowerCase());
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
