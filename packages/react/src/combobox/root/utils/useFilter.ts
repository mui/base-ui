'use client';
import * as React from 'react';
import { createCollatorItemFilter, createSingleSelectionCollatorFilter } from './index';

export interface UseFilterOptions extends Intl.CollatorOptions {
  /**
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument;
}

export interface Filter {
  contains: (item: any, query: string) => boolean;
  startsWith: (item: any, query: string) => boolean;
  endsWith: (item: any, query: string) => boolean;
}

const filterCache = new Map<string, Filter>();

function getFilter(options: UseFilterOptions = {}): Filter {
  const mergedOptions: Intl.CollatorOptions = {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...options,
  };

  const optionsString = JSON.stringify(mergedOptions);
  const cachedFilter = filterCache.get(optionsString);

  if (cachedFilter) {
    return cachedFilter;
  }

  const collator = new Intl.Collator(options.locale, mergedOptions);

  const filter: Filter = {
    contains(item: string, query: string) {
      if (!query) {
        return true;
      }

      for (let i = 0; i <= item.length - query.length; i += 1) {
        if (collator.compare(item.slice(i, i + query.length), query) === 0) {
          return true;
        }
      }

      return false;
    },
    startsWith(item: string, query: string) {
      if (!query) {
        return true;
      }
      return collator.compare(item.slice(0, query.length), query) === 0;
    },
    endsWith(item: string, query: string) {
      if (!query) {
        return true;
      }

      const queryLength = query.length;

      return (
        item.length >= queryLength &&
        collator.compare(item.slice(item.length - queryLength), query) === 0
      );
    },
  };

  filterCache.set(optionsString, filter);
  return filter;
}

/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export const useCoreFilter = getFilter;

export interface UseComboboxFilterOptions extends UseFilterOptions {
  /**
   * Whether the combobox is in multiple selection mode.
   * @default false
   */
  multiple?: boolean;
  /**
   * The current value of the combobox.
   */
  value?: any;
}

/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export function useComboboxFilter(options: UseComboboxFilterOptions = {}): Filter {
  const { multiple = false, value, ...collatorOptions } = options;

  const coreFilter = getFilter(collatorOptions);

  const contains: Filter['contains'] = React.useCallback(
    (item: any, query: string, itemToStringLabel?: (item: any) => string) => {
      if (multiple) {
        return createCollatorItemFilter(coreFilter, itemToStringLabel)(item, query);
      }
      return createSingleSelectionCollatorFilter(coreFilter, itemToStringLabel, value)(item, query);
    },
    [coreFilter, value, multiple],
  );

  return React.useMemo(
    () => ({
      contains,
      startsWith: coreFilter.startsWith,
      endsWith: coreFilter.endsWith,
    }),
    [contains, coreFilter],
  );
}
