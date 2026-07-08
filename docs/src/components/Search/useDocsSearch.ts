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
): ReturnType<typeof useSearch> & { performSearch: (value: string) => Promise<void> } {
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

  const { isReady, search } = searchApi;
  const lastReadySearchValueRef = React.useRef('');

  // The search index is built lazily, so a query typed before it is ready runs
  // against nothing. Replay the latest query once the index becomes ready.
  React.useEffect(() => {
    if (searchValue.trim() === '') {
      lastReadySearchValueRef.current = '';
      return;
    }

    if (!isReady || lastReadySearchValueRef.current === searchValue) {
      return;
    }

    lastReadySearchValueRef.current = searchValue;
    void search(searchValue, SEARCH_OPTIONS);
  }, [isReady, search, searchValue]);

  const performSearch = useStableCallback(async (value: string) => {
    lastReadySearchValueRef.current = isReady && value.trim() ? value : '';
    await search(value, SEARCH_OPTIONS);
  });

  return { ...searchApi, performSearch };
}
