import { stringifyAsLabel } from './resolveValueLabel';
import type { ItemFilter } from './filter';

/**
 * Enhanced filter using Intl.Collator for more robust string matching.
 * Uses the provided `itemToStringLabel` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
export function createCollatorItemFilter(
  collatorFilter: ItemFilter,
  itemToStringLabel?: (item: any) => string,
) {
  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }

    return collatorFilter(item, query, itemToStringLabel);
  };
}

/**
 * Enhanced filter for single selection mode using Intl.Collator that shows all items
 * when query is empty or matches the current selection, making it easier to browse options.
 */
export function createSingleSelectionCollatorFilter(
  collatorFilter: ItemFilter,
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

    const selectedString =
      selectedValue != null ? stringifyAsLabel(selectedValue, itemToStringLabel) : '';

    // Handle case-insensitive matching consistently
    if (
      selectedString &&
      collatorFilter(selectedString, query) &&
      selectedString.length === query.length
    ) {
      return true;
    }

    return collatorFilter(item, query, itemToStringLabel);
  };
}
