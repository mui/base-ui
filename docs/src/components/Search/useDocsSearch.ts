'use client';
import * as React from 'react';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import type { SearchResult } from '@mui/internal-docs-infra/useSearch/types';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getCanonicalReactDocsUrl } from 'docs/src/utils/canonicalReactDocsUrl';
import { groupSearchSitemapBySection, type SearchSitemapLoader } from './searchSitemap';
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
  const groupedSitemap = React.useCallback(async () => {
    const { sitemap: loadedSitemap } = await sitemap();

    return {
      sitemap: loadedSitemap ? groupSearchSitemapBySection(loadedSitemap) : undefined,
    };
  }, [sitemap]);

  const searchApi = useSearch({
    sitemap: groupedSitemap,
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

  // A query typed before the lazy index is ready is still pending: results have
  // collapsed to the defaults, so treat not-ready-yet the same as in-flight to
  // avoid rendering the default list under a real query.
  const isSearchPending = hasQuery && (!isReady || completedSearchId !== latestSearchIdRef.current);

  const buildResultUrl = useStableCallback((result: SearchResult) =>
    getCanonicalReactDocsUrl(searchApi.buildResultUrl(result)),
  );

  return {
    ...searchApi,
    buildResultUrl,
    results: acceptedResults,
    hasQuery,
    isSearchPending,
    performSearch,
  };
}
