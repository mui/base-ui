'use client';
import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';

export type SearchSitemapLoader = () => Promise<{ sitemap?: Sitemap }>;

let searchSitemapPromise: ReturnType<SearchSitemapLoader> | undefined;

export function loadSearchSitemap() {
  searchSitemapPromise ??= import('../../app/sitemap').catch((error) => {
    searchSitemapPromise = undefined;
    throw error;
  });

  return searchSitemapPromise;
}
