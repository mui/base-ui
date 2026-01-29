'use client';
import * as React from 'react';
import { createCollatorItemFilter, createSingleSelectionCollatorFilter } from './index';
import { stringifyAsLabel } from '../../../utils/resolveValueLabel';

export interface UseFilterOptions extends Intl.CollatorOptions {
  /**
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export interface Filter {
  contains: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  startsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  endsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
}

const filterCache = new Map<string, Filter>();

function stringifyLocale(locale?: Intl.LocalesArgument): string {
  if (Array.isArray(locale)) {
    return locale.map((value) => stringifyLocale(value)).join(',');
  }
  if (locale == null) {
    return '';
  }
  return String(locale);
}

function getFilter(options: UseFilterOptions = {}): Filter {
  const mergedOptions: Intl.CollatorOptions = {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...options,
  };

  const cacheKey = `${stringifyLocale(options.locale)}|${JSON.stringify(mergedOptions)}`;
  const cachedFilter = filterCache.get(cacheKey);

  if (cachedFilter) {
    return cachedFilter;
  }

  const collator = new Intl.Collator(options.locale, mergedOptions);

  const filter: Filter = {
    contains<Item>(item: Item, query: string, itemToString?: (item: Item) => string) {
      if (!query) {
        return true;
      }

      const itemString = stringifyAsLabel(item, itemToString);

      for (let i = 0; i <= itemString.length - query.length; i += 1) {
        if (collator.compare(itemString.slice(i, i + query.length), query) === 0) {
          return true;
        }
      }

      return false;
    },
    startsWith<Item>(item: Item, query: string, itemToString?: (item: Item) => string) {
      if (!query) {
        return true;
      }

      const itemString = stringifyAsLabel(item, itemToString);

      return collator.compare(itemString.slice(0, query.length), query) === 0;
    },
    endsWith<Item>(item: Item, query: string, itemToString?: (item: Item) => string) {
      if (!query) {
        return true;
      }

      const itemString = stringifyAsLabel(item, itemToString);
      const queryLength = query.length;

      return (
        itemString.length >= queryLength &&
        collator.compare(itemString.slice(itemString.length - queryLength), query) === 0
      );
    },
  };

  filterCache.set(cacheKey, filter);
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
  multiple?: boolean | undefined;
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
    (item: any, query: string, itemToString?: (item: any) => string) => {
      if (multiple) {
        return createCollatorItemFilter(coreFilter, itemToString)(item, query);
      }
      return createSingleSelectionCollatorFilter(coreFilter, itemToString, value)(item, query);
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
