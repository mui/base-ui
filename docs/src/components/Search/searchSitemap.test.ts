import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import { describe, expect, it } from 'vitest';
import { groupSearchSitemapBySection } from './searchSitemap';

describe('groupSearchSitemapBySection', () => {
  it('promotes grouped index sections to search categories', () => {
    const sitemap: Sitemap = {
      schema: {},
      data: {
        React: {
          title: 'React',
          prefix: '/react/',
          sections: [
            { group: '(overview)', title: 'Overview' },
            { group: '(handbook)', title: 'Handbook' },
          ],
          pages: [
            {
              title: 'Quick start',
              slug: 'quick-start',
              path: './(overview)/quick-start/page.mdx',
              section: 'Overview',
            },
            {
              title: 'Styling',
              slug: 'styling',
              path: './(handbook)/styling/page.mdx',
              section: 'Handbook',
            },
          ],
        },
      },
    };

    const groupedSitemap = groupSearchSitemapBySection(sitemap);

    expect(Object.values(groupedSitemap.data)).toEqual([
      {
        title: 'Overview',
        prefix: '/react/',
        pages: [sitemap.data.React.pages[0]],
      },
      {
        title: 'Handbook',
        prefix: '/react/',
        pages: [sitemap.data.React.pages[1]],
      },
    ]);
  });
});
