import { describe, expect, it, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import type { Element } from 'hast';
import remarkHeadingTags from '../../mdx/remarkHeadingTags.mjs';
import rehypeSlug from '../QuickNav/rehypeSlug.mjs';
import { loadSearchSitemap } from './searchSitemap';
import { slugifyWithParentContext } from './searchUtils';

// Section titles as the page index stores them: the heading text, tag included.
vi.mock('../../app/sitemap', () => ({
  sitemap: {
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
                  'filtering-preview': { title: 'Filtering [Preview]' },
                },
              },
            },
          },
        ],
      },
    },
  },
}));

async function renderHeadingId(markdown: string) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkHeadingTags)
    .use(remarkRehype)
    .use(rehypeSlug);
  const tree = await processor.run(processor.parse(markdown));
  return (tree.children[0] as Element).properties.id;
}

describe('loadSearchSitemap', () => {
  it('gives tagged headings the heading text as label and a URL matching the rendered heading', async () => {
    const { sitemap } = await loadSearchSitemap();
    const examples = sitemap!.data.Components.pages[0].sections!.examples;
    const { title } = examples.children!['filtering-preview'];

    expect(title).toBe('Filtering');
    expect(slugifyWithParentContext(title, [examples.title])).toBe(
      await renderHeadingId('### Filtering [Preview]\n'),
    );
  });
});
