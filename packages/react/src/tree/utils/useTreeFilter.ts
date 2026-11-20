import { getFilter } from '../../internals/filter';
import type { GetFilterParameters, Filter } from '../../internals/filter';

/** Locale-aware text matchers that can be passed straight to `filter`. */
export interface TreeFilter {
  /** Returns whether the text contains the query. */
  contains: (text: string, query: string) => boolean;
  /** Returns whether the text starts with the query. */
  startsWith: (text: string, query: string) => boolean;
  /** Returns whether the text ends with the query. */
  endsWith: (text: string, query: string) => boolean;
}

export type TreeFilterOptions = GetFilterParameters;

// `getFilter` returns one instance per options, so the matchers keep their identity too.
const treeFilters = new WeakMap<Filter, TreeFilter>();

export function getTreeFilter(options?: TreeFilterOptions): TreeFilter {
  const filter = getFilter(options);
  let treeFilter = treeFilters.get(filter);
  if (treeFilter === undefined) {
    treeFilter = {
      contains: (text, query) => filter.contains(text, query),
      startsWith: (text, query) => filter.startsWith(text, query),
      endsWith: (text, query) => filter.endsWith(text, query),
    };
    treeFilters.set(filter, treeFilter);
  }
  return treeFilter;
}

/**
 * Matches text against a query according to the user's locale, ignoring case, accents, and
 * punctuation by default. Its matchers can be passed straight to `filter`, and keep their
 * identity across renders.
 */
export function useTreeFilter(options?: TreeFilterOptions): TreeFilter {
  return getTreeFilter(options);
}
