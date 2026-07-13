'use client';
import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import { getNavSections } from 'docs/src/utils/navSections';

export type SearchSitemapLoader = () => Promise<{ sitemap?: Sitemap }>;

export function groupSearchSitemapBySection(sitemap: Sitemap): Sitemap {
  return {
    ...sitemap,
    data: Object.fromEntries(
      getNavSections(sitemap).map((section, index) => [
        index,
        {
          title: section.name,
          prefix: section.prefix,
          pages: section.pages,
        },
      ]),
    ),
  };
}

let searchSitemapPromise: ReturnType<SearchSitemapLoader> | undefined;

export function loadSearchSitemap() {
  searchSitemapPromise ??= import('../../app/sitemap').catch((error) => {
    searchSitemapPromise = undefined;
    throw error;
  });

  return searchSitemapPromise;
}
