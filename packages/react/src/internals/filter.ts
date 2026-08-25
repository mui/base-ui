import { stringifyLocale } from '@base-ui/utils/stringifyLocale';
import { stringifyAsLabel } from './resolveValueLabel';

const filterCache = new Map<string, Filter>();

export function getFilter(options: GetFilterParameters = {}): Filter {
  const { locale, ...restOptions } = options;
  const collatorOptions: Intl.CollatorOptions = {
    usage: 'search',
    sensitivity: 'base',
    ignorePunctuation: true,
    ...restOptions,
  };

  const cacheKey = `${stringifyLocale(locale)}|${JSON.stringify(collatorOptions)}`;
  const cachedFilter = filterCache.get(cacheKey);

  if (cachedFilter) {
    return cachedFilter;
  }

  const collator = new Intl.Collator(locale, collatorOptions);

  const filter: Filter = {
    contains(item, query, itemToString) {
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
    startsWith(item, query, itemToString) {
      if (!query) {
        return true;
      }

      const itemString = stringifyAsLabel(item, itemToString);
      return collator.compare(itemString.slice(0, query.length), query) === 0;
    },
    endsWith(item, query, itemToString) {
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

export interface GetFilterParameters extends Intl.CollatorOptions {
  /**
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export interface Filter {
  /** Returns whether the item matches the query anywhere. */
  contains: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  /** Returns whether the item starts with the query. */
  startsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
  /** Returns whether the item ends with the query. */
  endsWith: <Item>(item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
}
