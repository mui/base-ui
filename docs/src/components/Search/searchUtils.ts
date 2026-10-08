import type * as React from 'react';
import type { Sitemap, SitemapSection } from '@mui/internal-docs-infra/createSitemap/types';
import type { SearchResult } from '@mui/internal-docs-infra/useSearch/types';
import { stringToUrl } from '../QuickNav/rehypeSlug.mjs';
import { stripTrailingHeadingTag } from '../../mdx/remarkHeadingTags.mjs';

export interface GroupedSearchResults {
  results: Array<{
    items: unknown[];
  }>;
}

// Semver pattern to detect version headings (e.g., v1.0.0, v1.0.0-rc.0).
// Prefix child slugs with a parent semver version to match release heading IDs.
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function slugifyWithParentContext(text: string, parentTitles?: string[]): string {
  const slug = stringToUrl(text);

  if (parentTitles?.length && SEMVER_PATTERN.test(parentTitles[0])) {
    return `${parentTitles[0]}-${slug}`;
  }

  return slug;
}

function stripSectionHeadingTags(
  sections: Record<string, SitemapSection> | undefined,
): Record<string, SitemapSection> | undefined {
  if (!sections) {
    return sections;
  }

  return Object.fromEntries(
    Object.entries(sections).map(([slug, section]) => [
      slug,
      {
        ...section,
        title: stripTrailingHeadingTag(section.title),
        children: stripSectionHeadingTags(section.children),
      },
    ]),
  );
}

/**
 * Section titles in the page index keep heading badges such as `[Preview]`, but the
 * headings render them as badges, not text, and build their IDs without them.
 * Strip them so search shows the heading text and links to the heading.
 */
export function stripSitemapHeadingTags(sitemap: Sitemap): Sitemap {
  return {
    ...sitemap,
    data: Object.fromEntries(
      Object.entries(sitemap.data).map(([name, sectionData]) => [
        name,
        {
          ...sectionData,
          pages: sectionData.pages.map((page) => ({
            ...page,
            sections: stripSectionHeadingTags(page.sections),
          })),
        },
      ]),
    ),
  };
}

export function normalizeSearchGroup(group: string) {
  return group.replace(/\s+Pages$/, '').replace(/^React\s+/, '');
}

export function getSearchResultCount(results: GroupedSearchResults) {
  return results.results.reduce((sum, group) => sum + group.items.length, 0);
}

export function searchResultToString(item: SearchResult | null) {
  return item ? item.title || item.slug : '';
}

export function handleModifiedEnterNavigation(
  event: React.KeyboardEvent,
  result: SearchResult | undefined,
  buildResultUrl: (result: SearchResult) => string,
) {
  // Ignore key presses during IME composition. `keyCode === 229` covers
  // Safari, where `isComposing` is unreliable.
  if (event.nativeEvent.isComposing || event.keyCode === 229) {
    return false;
  }

  if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey && !event.altKey)) {
    return false;
  }

  if (!result) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  window.open(buildResultUrl(result), '_blank', 'noopener,noreferrer');
  return true;
}
