import * as React from 'react';
import type { Metadata } from 'next/types';
import * as SideNav from 'docs/src/components/SideNav';
import * as QuickNav from 'docs/src/components/QuickNav/QuickNav';
import { Header } from 'docs/src/components/Header';
import { MAIN_CONTENT_ID } from 'docs/src/components/SkipNav';
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
                <SideNav.Item key={link.href} href={link.href} external={link.external}>
                  {link.label}
                  {link.isNew && <SideNav.Badge>New</SideNav.Badge>}
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
