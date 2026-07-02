'use client';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import { type SearchSitemapLoader } from './searchSitemap';
import { slugifyWithParentContext } from './searchUtils';

const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

export function useDocsSearch(sitemap: SearchSitemapLoader) {
  return useSearch({
    sitemap,
    generateSlug: slugifyWithParentContext,
    tolerance: 0,
    limit: 20,
    enableStemming: true,
    includeCategoryInGroup: true,
    excludeSections: true,
    showPrivatePages,
  });
}
