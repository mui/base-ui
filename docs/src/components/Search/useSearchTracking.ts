'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { SearchResult } from '@mui/internal-docs-infra/useSearch/types';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';

interface UseSearchTrackingOptions {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useSearchTracking({ open, onOpen, onClose }: UseSearchTrackingOptions = {}) {
  const ga = useGoogleAnalytics();
  const searchQueryRef = React.useRef('');
  const resultCountRef = React.useRef(0);
  const attemptRef = React.useRef(0);
  const selectedResultRef = React.useRef<SearchResult | null>(null);
  const lastTrackedQueryRef = React.useRef('');
  const wasOpenRef = React.useRef(open ?? false);
  const queryDebounceTimeout = useTimeout();

  const handleOpen = React.useCallback(() => {
    searchQueryRef.current = '';
    resultCountRef.current = 0;
    attemptRef.current = 0;
    selectedResultRef.current = null;
    lastTrackedQueryRef.current = '';
    queryDebounceTimeout.clear();
    ga?.trackEvent({ category: 'search', action: 'open' });
  }, [ga, queryDebounceTimeout]);

  const handleClose = React.useCallback(() => {
    queryDebounceTimeout.clear();

    if (searchQueryRef.current) {
      const selected = selectedResultRef.current;
      ga?.trackEvent({
        category: 'search',
        action: selected ? 'select' : 'dismiss',
        label: searchQueryRef.current,
        params: {
          search_term: searchQueryRef.current,
          result_count: resultCountRef.current,
          attempt: attemptRef.current,
          ...(selected
            ? {
                selected_result: selected.title || selected.slug,
                selected_type: selected.type || '',
              }
            : { failed: searchQueryRef.current }),
        },
      });
      lastTrackedQueryRef.current = searchQueryRef.current;
    }
  }, [ga, queryDebounceTimeout]);

  const handleSearchValueChange = React.useCallback(
    (value: string) => {
      queryDebounceTimeout.clear();

      const previousLength = searchQueryRef.current.length;
      searchQueryRef.current = value;
      if (!value) {
        return;
      }

      if (previousLength === 0) {
        attemptRef.current += 1;
      }

      queryDebounceTimeout.start(1500, () => {
        if (searchQueryRef.current && searchQueryRef.current !== lastTrackedQueryRef.current) {
          ga?.trackEvent({
            category: 'search',
            action: 'query',
            label: searchQueryRef.current,
            params: {
              search_term: searchQueryRef.current,
              result_count: resultCountRef.current,
              attempt: attemptRef.current,
            },
          });
          lastTrackedQueryRef.current = searchQueryRef.current;
        }
      });
    },
    [ga, queryDebounceTimeout],
  );

  const setResultCount = React.useCallback((resultCount: number) => {
    resultCountRef.current = resultCount;
  }, []);

  const setSelectedResult = React.useCallback((result: SearchResult | null) => {
    selectedResultRef.current = result;
  }, []);

  const handleTrackedOpenChange = useStableCallback((nextOpen: boolean) => {
    if (nextOpen) {
      onOpen?.();
      handleOpen();
    } else {
      handleClose();
      onClose?.();
    }
  });

  React.useEffect(() => {
    if (open === undefined) {
      return;
    }

    if (open !== wasOpenRef.current) {
      handleTrackedOpenChange(open);
    }

    wasOpenRef.current = open;
  }, [handleTrackedOpenChange, open]);

  return React.useMemo(
    () => ({
      handleSearchValueChange,
      setResultCount,
      setSelectedResult,
    }),
    [handleSearchValueChange, setResultCount, setSelectedResult],
  );
}
