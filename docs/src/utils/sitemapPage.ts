import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import { getCanonicalReactDocsUrl } from './canonicalReactDocsUrl';

const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

type SitemapSection = Sitemap['data'][string];
type SitemapPage = SitemapSection['pages'][number];

export function isSitemapPageVisible(page: SitemapPage) {
  return page.audience === 'private' ? showPrivatePages : true;
}

export function getSitemapPageInfo(section: Pick<SitemapSection, 'prefix'>, page: SitemapPage) {
  const badges: Array<'Private' | 'Preview' | 'New'> = [];
  const isPrivatePage = page.audience === 'private';
  const isPreviewPage = page.tags?.includes('Preview') ?? false;
  const isNewPage = page.tags?.includes('New') ?? false;

  if (isPrivatePage) {
    badges.push('Private');
  }

  if (isPreviewPage) {
    badges.push('Preview');
  }

  if (isNewPage && !isPreviewPage && !isPrivatePage) {
    badges.push('New');
  }

  return {
    badges,
    external: page.tags?.includes('External') ?? false,
    href: getCanonicalReactDocsUrl(
      page.path.startsWith('./')
        ? `${section.prefix}${page.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
        : page.path,
    ),
  };
}
