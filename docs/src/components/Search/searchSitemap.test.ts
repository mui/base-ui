// @vitest-environment jsdom
import * as React from 'react';
import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import { render, screen, within } from '@mui/internal-test-utils';
import { describe, expect, it } from 'vitest';
import { MobileNavContent } from '../MobileNavContent';
import { SideNavContent } from '../SideNavContent';
import { groupSearchSitemapBySection } from './searchSitemap';

const SECTION_PAGES = [
  ['Overview', 'Quick start', '(overview)/quick-start'],
  ['Handbook', 'Styling', '(handbook)/styling'],
  ['Components', 'Accordion', '(components)/accordion'],
  ['Utils', 'CSP Provider', '(utils)/csp-provider'],
] as const;

const sitemap: Sitemap = {
  schema: {},
  data: {
    React: {
      title: 'React',
      prefix: '/react/',
      sections: SECTION_PAGES.map(([section, , path]) => ({
        group: path.slice(0, path.indexOf('/')),
        title: section,
      })),
      pages: SECTION_PAGES.map(([section, title, path]) => ({
        title,
        slug: path.split('/').at(-1)!,
        path: `./${path}/page.mdx`,
        section,
      })),
    },
  },
};

function getHeadingText(container: HTMLElement, selector: string) {
  return Array.from(container.querySelectorAll(selector), (heading) => heading.textContent);
}

describe('grouped sitemap consumers', () => {
  it('renders each section in desktop navigation', () => {
    const { container } = render(React.createElement(SideNavContent, { sitemap }));

    expect(getHeadingText(container, '.SideNavHeading')).toEqual(
      SECTION_PAGES.map(([section]) => section),
    );

    SECTION_PAGES.forEach(([section, title]) => {
      const heading = screen.getByText(section, { selector: '.SideNavHeading' });
      expect(within(heading.parentElement!).getByRole('link', { name: title })).toBeVisible();
    });
  });

  it('renders each section in mobile navigation', () => {
    const { container } = render(React.createElement(MobileNavContent, { sitemap }));

    expect(getHeadingText(container, '.MobileNavHeading')).toEqual([
      'Overview',
      'Handbook',
      'Components',
      'Utils',
      'Resources',
    ]);

    SECTION_PAGES.forEach(([section, title]) => {
      const heading = screen.getByText(section, { selector: '.MobileNavHeading' });
      expect(within(heading.parentElement!).getByRole('link', { name: title })).toBeVisible();
    });
  });

  it('uses each section as a search category', () => {
    const groupedSitemap = groupSearchSitemapBySection(sitemap);

    expect(
      Object.values(groupedSitemap.data).map((section) => ({
        title: section.title,
        pages: section.pages.map((page) => page.title),
      })),
    ).toEqual(
      SECTION_PAGES.map(([section, title]) => ({
        title: section,
        pages: [title],
      })),
    );
  });
});
