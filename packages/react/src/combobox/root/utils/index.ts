import { serializeValue } from '../../../utils/serializeValue';
import type { Filter } from './useFilter';

export interface Group<Item = any> {
  value: unknown;
  items: Item[];
}

export function isGroupedItems(items: (any | Group<any>)[] | undefined): items is Group<any>[] {
  return (
    items != null &&
    items.length > 0 &&
    typeof items[0] === 'object' &&
    items[0] != null &&
    'items' in (items[0] as object)
  );
}

export function stringifyItem(
  item: any | null | undefined,
  itemToStringLabel?: (item: any) => string,
) {
  if (itemToStringLabel && item != null) {
    return itemToStringLabel(item) ?? '';
  }
  if (item && typeof item === 'object') {
    // Prefer human-readable labels when available for matching/display.
    // Falls back to `value` for objects that only provide a machine value.
    if ('label' in item && item.label != null) {
      return String(item.label);
    }
    if ('value' in item) {
      return String(item.value);
    }
  }
  return serializeValue(item);
}

/**
 * Converts an item into a string suitable for value serialization (e.g., form submission).
 * Prefers:
 * - itemToStringValue when provided
 * - object's `value` when the item looks like { value, label, ... }
 * - serializeValue fallback for all other cases
 */
export function stringifyItemValue(
  item: any | null | undefined,
  itemToStringValue?: (item: any) => string,
) {
  if (itemToStringValue && item != null) {
    return itemToStringValue(item) ?? '';
  }
  if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
    return serializeValue((item as Record<string, unknown>).value);
  }
  return serializeValue(item);
}

/**
 * Enhanced filter using Intl.Collator for more robust string matching.
 * Uses the provided `itemToStringLabel` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
export function createCollatorItemFilter(
  collatorFilter: Filter,
  itemToStringLabel?: (item: any) => string,
) {
  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }
    const itemString = stringifyItem(item, itemToStringLabel);
    return collatorFilter.contains(itemString, query);
  };
}

/**
 * Enhanced filter for single selection mode using Intl.Collator that shows all items
 * when query is empty or matches the current selection, making it easier to browse options.
 */
export function createSingleSelectionCollatorFilter(
  collatorFilter: Filter,
  itemToStringLabel?: (item: any) => string,
  selectedValue?: any,
) {
  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }
    if (!query) {
      return true;
    }

    const itemString = stringifyItem(item, itemToStringLabel);
    const selectedString =
      selectedValue != null ? stringifyItem(selectedValue, itemToStringLabel) : '';

    // Handle case-insensitive matching consistently
    if (
      selectedString &&
      collatorFilter.contains(selectedString, query) &&
      selectedString.length === query.length
    ) {
      return true;
    }

    return collatorFilter.contains(itemString, query);
  };
}
