import { serializeValue } from '../../../utils/serializeValue';
import { useFilter } from './useFilter';

export interface ComboboxGroup<Item = any> {
  /**
   * A label or value that identifies this group when required by the consumer.
   * When `Item` is an object with a `value` field, this should typically match that type;
   * however, for simple string items it can be any value.
   */
  value: unknown;
  items: Item[];
}

export function isGroupedItems(
  items: (any | ComboboxGroup<any>)[] | undefined,
): items is ComboboxGroup<any>[] {
  return (
    items != null &&
    items.length > 0 &&
    typeof items[0] === 'object' &&
    items[0] != null &&
    'items' in (items[0] as object)
  );
}

export function stringifyItem(item: any | null | undefined, itemToLabel?: (item: any) => string) {
  if (itemToLabel && item != null) {
    return itemToLabel(item) ?? '';
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
 * Enhanced filter using Intl.Collator for more robust string matching.
 * Uses the provided `itemToLabel` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
export function createCollatorItemFilter(
  collatorFilter: ReturnType<typeof useFilter>,
  itemToLabel?: (item: any) => string,
) {
  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }
    const itemString = stringifyItem(item, itemToLabel);
    return collatorFilter.contains(itemString, query);
  };
}

/**
 * Enhanced filter for single selection mode using Intl.Collator that shows all items
 * when query is empty or matches the current selection, making it easier to browse options.
 */
export function createSingleSelectionCollatorFilter(
  collatorFilter: ReturnType<typeof useFilter>,
  itemToLabel?: (item: any) => string,
  selectedValue?: any,
) {
  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }
    if (!query) {
      return true;
    }

    const itemString = stringifyItem(item, itemToLabel);
    const selectedString = selectedValue != null ? stringifyItem(selectedValue, itemToLabel) : '';

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
