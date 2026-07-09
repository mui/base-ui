'use client';
import * as React from 'react';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { type SearchSitemapLoader } from './searchSitemap';
import { slugifyWithParentContext } from './searchUtils';

const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

const SEARCH_OPTIONS = { groupBy: { properties: ['group'], maxResult: 5 } };

export function useDocsSearch(
  sitemap: SearchSitemapLoader,
  searchValue: string,
): ReturnType<typeof useSearch> & {
  hasQuery: boolean;
  isSearchPending: boolean;
  performSearch: (value: string) => Promise<void>;
} {
  const searchApi = useSearch({
    sitemap,
    generateSlug: slugifyWithParentContext,
    tolerance: 0,
    limit: 20,
    enableStemming: true,
    includeCategoryInGroup: true,
    excludeSections: true,
    showPrivatePages,
  });

  const { isReady, results, search } = searchApi;
  const [acceptedResults, setAcceptedResults] = React.useState(results);
  const [completedSearchId, setCompletedSearchId] = React.useState(0);
  const lastReadySearchValueRef = React.useRef('');
  const latestSearchIdRef = React.useRef(0);
  const hasQuery = searchValue.trim() !== '';

  React.useEffect(() => {
    if (completedSearchId === latestSearchIdRef.current) {
      setAcceptedResults(results);
    }
  }, [completedSearchId, results]);

  const performSearch = useStableCallback(async (value: string) => {
    const searchId = latestSearchIdRef.current + 1;
    latestSearchIdRef.current = searchId;
    lastReadySearchValueRef.current = isReady && value.trim() ? value : '';
    await search(value, SEARCH_OPTIONS);
    setCompletedSearchId(searchId);
  });

  // The search index is built lazily, so a query typed before it is ready runs
  // against nothing. Replay the latest query once the index becomes ready.
  React.useEffect(() => {
    if (!hasQuery) {
      lastReadySearchValueRef.current = '';
      return;
    }

    if (!isReady || lastReadySearchValueRef.current === searchValue) {
      return;
    }

    lastReadySearchValueRef.current = searchValue;
    void performSearch(searchValue);
  }, [hasQuery, isReady, performSearch, searchValue]);

  const isSearchPending = hasQuery && isReady && completedSearchId !== latestSearchIdRef.current;

  return { ...searchApi, results: acceptedResults, hasQuery, isSearchPending, performSearch };
}
