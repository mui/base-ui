'use client';
import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import { stripSitemapHeadingTags } from './searchUtils';

export type SearchSitemapLoader = () => Promise<{ sitemap?: Sitemap }>;

let searchSitemapPromise: ReturnType<SearchSitemapLoader> | undefined;

export function loadSearchSitemap() {
  searchSitemapPromise ??= import('../../app/sitemap')
    .then(({ sitemap }) => ({ sitemap: sitemap && stripSitemapHeadingTags(sitemap) }))
    .catch((error) => {
      searchSitemapPromise = undefined;
      throw error;
    });

  return searchSitemapPromise;
}
