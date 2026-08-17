import { stringifyLocale } from '@base-ui/utils/stringifyLocale';
import { stringifyAsLabel } from './resolveValueLabel';

const filterCache = new Map<string, Filter>();
const containsFilterCache = new Map<string, ItemFilter>();

export function getFilter(options: GetFilterParameters = {}): Filter {
  const cacheKey = getCacheKey(options);
  const cachedFilter = filterCache.get(cacheKey);

  if (cachedFilter) {
    return cachedFilter;
  }

  const collator = createCollator(options);

  const filter: Filter = {
    contains: createContainsFilter(collator),
    startsWith: createStartsWithFilter(collator),
    endsWith: createEndsWithFilter(collator),
  };

  filterCache.set(cacheKey, filter);
  return filter;
}

export function getContainsFilter(options: GetFilterParameters = {}): ItemFilter {
  const cacheKey = getCacheKey(options);
  const cachedFilter = containsFilterCache.get(cacheKey);

  if (cachedFilter) {
    return cachedFilter;
  }

  const filter = createContainsFilter(createCollator(options));
  containsFilterCache.set(cacheKey, filter);
  return filter;
}

function createCollator(options: GetFilterParameters = {}) {
  const { locale, ...collatorOptions } = options;

  return new Intl.Collator(locale, getCollatorOptions(collatorOptions));
}

function getCacheKey(options: GetFilterParameters) {
  const { locale, ...collatorOptions } = options;

  const mergedOptions = getCollatorOptions(collatorOptions);
  return `${stringifyLocale(locale)}|${JSON.stringify(mergedOptions)}`;
}

function getCollatorOptions(options: Intl.CollatorOptions): Intl.CollatorOptions {
  return {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...options,
  };
}

function createContainsFilter(collator: Intl.Collator): ItemFilter {
  return (item, query, itemToString) => {
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
  };
}

function createStartsWithFilter(collator: Intl.Collator): ItemFilter {
  return (item, query, itemToString) => {
    if (!query) {
      return true;
    }

    const itemString = stringifyAsLabel(item, itemToString);
    return collator.compare(itemString.slice(0, query.length), query) === 0;
  };
}

function createEndsWithFilter(collator: Intl.Collator): ItemFilter {
  return (item, query, itemToString) => {
    if (!query) {
      return true;
    }

    const itemString = stringifyAsLabel(item, itemToString);
    const queryLength = query.length;

    return (
      itemString.length >= queryLength &&
      collator.compare(itemString.slice(itemString.length - queryLength), query) === 0
    );
  };
}

export interface GetFilterParameters extends Intl.CollatorOptions {
  /**
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export type ItemFilter = <Item>(
  item: Item,
  query: string,
  itemToString?: (item: Item) => string,
) => boolean;

export interface Filter {
  /** Returns whether the item matches the query anywhere. */
  contains: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  /** Returns whether the item starts with the query. */
  startsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  /** Returns whether the item ends with the query. */
  endsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
}
