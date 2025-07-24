import * as React from 'react';

const cache = new Map<string, Intl.Collator>();

function getCollator(options: Intl.CollatorOptions = {}) {
  const optionsString = JSON.stringify(options);
  const cachedCollator = cache.get(optionsString);

  if (cachedCollator) {
    return cachedCollator;
  }

  const collator = new Intl.Collator(undefined, options);
  cache.set(optionsString, collator);

  return collator;
}

/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export function useFilter(options: Intl.CollatorOptions = {}) {
  const collator = React.useMemo(() => getCollator(options), [options]);

  return React.useMemo(
    () => ({
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
    }),
    [collator],
  );
}
