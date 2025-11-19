import * as React from 'react';
import type { Metadata } from 'next/types';
import * as SideNav from 'docs/src/components/SideNav';
import * as QuickNav from 'docs/src/components/QuickNav/QuickNav';
import { Header, titleMap } from 'docs/src/components/Header';
import { MAIN_CONTENT_ID } from 'docs/src/components/SkipNav';
import { sitemap } from 'docs/src/app/sitemap';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="ContentLayoutRoot">
      <Header />
      <SideNav.Root>
        {sitemap &&
          Object.entries(
            sitemap.data as Record<
              string,
              {
                title?: string;
                prefix?: string;
                pages: { title: string; tags?: string[]; path: string }[];
              }
            >,
          ).map(([name, section]) => (
            <SideNav.Section key={name}>
              <SideNav.Heading>{name}</SideNav.Heading>
              <SideNav.List>
                {section.pages.map((page) => (
                  <SideNav.Item
                    key={page.title}
                    href={
                      page.path.startsWith('./')
                        ? `${section.prefix}${page.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
                        : page.path
                    }
                    external={page.tags?.includes('External')}
                  >
                    {titleMap[page.title] || page.title}
                    {page.tags?.includes('New') && <SideNav.Badge>New</SideNav.Badge>}
                  </SideNav.Item>
                ))}
              </SideNav.List>
            </SideNav.Section>
          ))}
      </SideNav.Root>

      <main className="ContentLayoutMain" id={MAIN_CONTENT_ID}>
        <QuickNav.Container>{children}</QuickNav.Container>
      </main>
    </div>
  );
}

// Title and description are pulled from <h1> and <Subtitle> in the MDX.
export const metadata: Metadata = {
  title: null,
  description: null,
};
