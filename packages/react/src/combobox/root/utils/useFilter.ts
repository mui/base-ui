interface Filter {
  contains: (item: string, query: string) => boolean;
  startsWith: (item: string, query: string) => boolean;
  endsWith: (item: string, query: string) => boolean;
}

const collatorCache = new Map<string, Intl.Collator>();
const filterCache = new Map<string, Filter>();

function getCollator(options: Intl.CollatorOptions = {}) {
  const optionsString = JSON.stringify(options);
  const cachedCollator = collatorCache.get(optionsString);

  if (cachedCollator) {
    return cachedCollator;
  }

  const collator = new Intl.Collator(undefined, options);
  collatorCache.set(optionsString, collator);

  return collator;
}

function getFilter(options: Intl.CollatorOptions = {}): Filter {
  const optionsString = JSON.stringify(options);
  const cachedFilter = filterCache.get(optionsString);

  if (cachedFilter) {
    return cachedFilter;
  }

  const collator = getCollator(options);

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
export function useFilter(options: Intl.CollatorOptions = {}) {
  return getFilter(options);
}
