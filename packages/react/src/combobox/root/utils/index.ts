import { isLabeledItem, stringifyAsLabel } from '../../../internals/resolveValueLabel';
import type { Filter } from './useFilter';

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
    const itemString = stringifyComboboxItemLabel(item, itemToStringLabel);
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
  selectedString?: string,
) {
  const resolvedSelectedString =
    selectedString ??
    (selectedValue != null ? stringifyAsLabel(selectedValue, itemToStringLabel) : '');

  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }
    if (!query) {
      return true;
    }

    const itemString = stringifyComboboxItemLabel(item, itemToStringLabel);

    // Handle case-insensitive matching consistently
    if (
      resolvedSelectedString &&
      collatorFilter.contains(resolvedSelectedString, query) &&
      resolvedSelectedString.length === query.length
    ) {
      return true;
    }

    return collatorFilter.contains(itemString, query);
  };
}

export function stringifyComboboxItemLabel(item: any, itemToStringLabel?: (item: any) => string) {
  if (isLabeledItem(item)) {
    return String(item.label ?? '');
  }

  return stringifyAsLabel(item, itemToStringLabel);
}
