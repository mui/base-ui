import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';
import * as SideNav from 'docs/src/components/SideNav';
import * as QuickNav from 'docs/src/components/QuickNav/QuickNav';
import { Header } from 'docs/src/components/Header';
import { nav } from 'docs/src/nav';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="ContentLayoutRoot">
      <Header />
      <SideNav.Root>
        {nav.map((section) => (
          <SideNav.Section key={section.label}>
            <SideNav.Heading>{section.label}</SideNav.Heading>
            <SideNav.List>
              {section.links.map((link) => (
                <SideNav.Item key={link.href} href={link.href}>
                  <SideNav.Label>{link.label}</SideNav.Label>
                  {link.isNew && <SideNav.Badge>New</SideNav.Badge>}
                  {link.isNewCorner && (
                    <SideNav.CornerBadge>New</SideNav.CornerBadge>
                  )}
                  {link.isNewEnd && <SideNav.EndBadge>New</SideNav.EndBadge>}
                </SideNav.Item>
              ))}
            </SideNav.List>
          </SideNav.Section>
        ))}
      </SideNav.Root>

      <main className="ContentLayoutMain">
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

export const viewport: Viewport = {
  themeColor: [
    // Desktop Safari header background
    {
      media: '(prefers-color-scheme: light) and (min-width: 1024px)',
      color: 'oklch(95% 0.25% 264)',
    },
    {
      media: '(prefers-color-scheme: dark) and (min-width: 1024px)',
      color: 'oklch(25% 1% 264)',
    },

    // Mobile Safari header background (match the site header)
    {
      media: '(prefers-color-scheme: light)',
      color: 'oklch(98% 0.25% 264)',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: 'oklch(17% 1% 264)',
    },
  ],
};
