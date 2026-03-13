import { resolveItemKeywords, stringifyAsLabel } from '../../../utils/resolveValueLabel';
import type { Filter } from './useFilter';

/**
 * Returns true when any keyword matches the query using the collator filter.
 */
function matchesKeywords(collatorFilter: Filter, keywords: string[], query: string) {
  if (query === '') {
    return true;
  }

  if (!keywords.length) {
    return false;
  }

  const queryLength = query.length;
  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    if (keyword.length < queryLength) {
      continue;
    }
    if (collatorFilter.contains(keyword, query)) {
      return true;
    }
  }

  return false;
}

/**
 * Enhanced filter using Intl.Collator for more robust string matching.
 * Uses the provided `itemToStringLabel` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 * Also matches an item's `keywords` array when present (keywords are trimmed).
 */
export function createCollatorItemFilter(
  collatorFilter: Filter,
  itemToStringLabel?: (item: any) => string,
) {
  return (item: any, query: string) => {
    if (item == null) {
      return false;
    }
    const keywords = resolveItemKeywords(item);
    if (matchesKeywords(collatorFilter, keywords, query)) {
      return true;
    }

    const itemString = stringifyAsLabel(item, itemToStringLabel);
    return collatorFilter.contains(itemString, query);
  };
}

/**
 * Enhanced filter for single selection mode using Intl.Collator that shows all items
 * when query is empty or matches the current selection, making it easier to browse options.
 * Also matches an item's `keywords` array when present (keywords are trimmed).
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

    const keywords = resolveItemKeywords(item);
    if (matchesKeywords(collatorFilter, keywords, query)) {
      return true;
    }

    const itemString = stringifyAsLabel(item, itemToStringLabel);
    const selectedString =
      selectedValue != null ? stringifyAsLabel(selectedValue, itemToStringLabel) : '';

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
