'use client';
import * as React from 'react';
import { createCollatorItemFilter, createSingleSelectionCollatorFilter } from './index';
import { getFilter, getTextMatcher } from '../../../internals/filter';
import type { Filter, GetFilterParameters as UseFilterOptions } from '../../../internals/filter';

export type { Filter, UseFilterOptions };

/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export const useCoreFilter = getFilter;

export interface UseComboboxFilterOptions extends UseFilterOptions {
  /**
   * Whether the combobox is in multiple selection mode.
   * @default false
   */
  multiple?: boolean | undefined;
  /**
   * The current value of the combobox, used to keep every item visible while the query still
   * matches the selection.
   */
  value?: any;
}

/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export function useComboboxFilter(options: UseComboboxFilterOptions = {}): Filter {
  const { multiple = false, value, ...collatorOptions } = options;

  const matcher = getTextMatcher(collatorOptions);

  const contains: Filter['contains'] = React.useCallback(
    (item: any, query: string, itemToString?: (item: any) => string) => {
      if (multiple) {
        return createCollatorItemFilter(matcher.filter, itemToString)(item, query);
      }
      return createSingleSelectionCollatorFilter(matcher, itemToString, value)(item, query);
    },
    [matcher, value, multiple],
  );

  return React.useMemo(() => ({ ...matcher.filter, contains }), [contains, matcher]);
}
