import type { Sitemap, SitemapPage } from '@mui/internal-docs-infra/createSitemap/types';

export interface NavSection {
  name: string;
  prefix: string;
  pages: SitemapPage[];
}

/**
 * Flattens the sitemap into the list of nav groups to render.
 *
 * The React docs use a single combined index (`react/page.mdx`) whose `##` headings define the
 * sections (Overview, Handbook, Components, Utilities). `createSitemap` therefore returns a single
 * entry with a `sections` array; split it into one nav group per section, bucketing pages by the
 * `section` the loader assigned each of them. Falls back to one group per data entry for a flat
 * (ungrouped) index.
 */
export function getNavSections(sitemap: Sitemap): NavSection[] {
  return Object.values(sitemap.data).flatMap((entry) => {
    if (entry.sections && entry.sections.length > 0) {
      return entry.sections.map((section) => ({
        name: section.title,
        prefix: entry.prefix,
        pages: entry.pages.filter((page) => page.section === section.title),
      }));
    }
    return [{ name: entry.title, prefix: entry.prefix, pages: entry.pages }];
  });
}
