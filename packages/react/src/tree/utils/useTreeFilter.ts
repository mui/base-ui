import { getFilter, type UseFilterOptions, type Filter } from '../../utils/filter';

export type { UseFilterOptions, Filter };

/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export function useTreeFilter(options?: UseFilterOptions): Filter {
  return getFilter(options);
}
