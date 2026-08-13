'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { getSearchResultCount, type GroupedSearchResults } from './searchUtils';

interface UseDeferredEmptySearchResultsParameters<Results extends GroupedSearchResults> {
  active?: boolean;
  defaultResults: Results;
  onResultCountChange?: (resultCount: number) => void;
  // Lets closing surfaces reset their hidden result state after exit animations.
  resetDelay?: number;
  results: Results;
}

export function useDeferredEmptySearchResults<Results extends GroupedSearchResults>({
  active = true,
  defaultResults,
  onResultCountChange,
  resetDelay = 0,
  results,
}: UseDeferredEmptySearchResultsParameters<Results>) {
  const emptyResultsTimeout = useTimeout();
  const [delayedResults, setDelayedResults] = React.useState<Results>(defaultResults);

  React.useEffect(() => {
    if (!active) {
      emptyResultsTimeout.clear();

      if (resetDelay > 0) {
        emptyResultsTimeout.start(resetDelay, () => {
          setDelayedResults(defaultResults);
        });
        return emptyResultsTimeout.clear;
      }

      setDelayedResults(defaultResults);
      return undefined;
    }

    onResultCountChange?.(getSearchResultCount(results));

    if (results.results.length === 0) {
      // Avoid flashing "No results" while the user is still typing.
      emptyResultsTimeout.start(400, () => {
        setDelayedResults(results);
      });
      return emptyResultsTimeout.clear;
    }

    emptyResultsTimeout.clear();
    setDelayedResults(results);
    return undefined;
  }, [active, defaultResults, emptyResultsTimeout, onResultCountChange, resetDelay, results]);

  return delayedResults;
}
