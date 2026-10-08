import { describe, expect, it } from 'vitest';
import type { Sitemap } from '@mui/internal-docs-infra/createSitemap/types';
import { stripSitemapHeadingTags } from './searchUtils';

describe('stripSitemapHeadingTags', () => {
  it('removes trailing heading badges from section titles at every depth', () => {
    const sitemap: Sitemap = {
      schema: {},
      data: {
        Components: {
          title: 'Components',
          prefix: '/react/components/',
          sections: [],
          pages: [
            {
              title: 'Menu',
              slug: 'menu',
              path: './menu/page.mdx',
              section: null,
              sections: {
                examples: {
                  title: 'Examples',
                  children: {
                    'filtering-preview': {
                      title: 'Filtering [Preview]',
                      children: {
                        highlighting: { title: 'Highlighting' },
                      },
                    },
                  },
                },
                'api-reference': {
                  title: 'API reference',
                  children: {
                    'filterprovider-preview': { title: 'FilterProvider [Preview]' },
                    'use-value': { title: 'Use [value]' },
                  },
                },
              },
            },
          ],
        },
      },
    };

    const sections = stripSitemapHeadingTags(sitemap).data.Components.pages[0].sections!;

    expect(sections.examples.children!['filtering-preview'].title).toBe('Filtering');
    expect(sections.examples.children!['filtering-preview'].children!.highlighting.title).toBe(
      'Highlighting',
    );
    expect(sections['api-reference'].children!['filterprovider-preview'].title).toBe(
      'FilterProvider',
    );
    expect(sections['api-reference'].children!['use-value'].title).toBe('Use [value]');
  });
});
