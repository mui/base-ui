import * as React from 'react';
import type { Metadata } from 'next/types';
import * as SideNav from 'docs/src/components/SideNav';
import * as QuickNav from 'docs/src/components/quick-nav/QuickNav';
import { Header } from 'docs/src/components/Header';
import { nav } from 'docs/src/nav';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <React.Fragment>
      <Header />

      <div className="ContentLayoutOuter">
        <div className="ContentLayoutInner">
          <SideNav.Root>
            {nav.map((section) => (
              <SideNav.Section key={section.label}>
                <SideNav.Heading>{section.label}</SideNav.Heading>
                <SideNav.List>
                  {section.links.map((link) => (
                    <SideNav.Item key={link.href} href={link.href}>
                      {link.label}
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
      </div>
    </React.Fragment>
  );
}

// Title and description are pulled from <h1> and <Subtitle> in the MDX.
export const metadata: Metadata = {
  title: null,
  description: null,
};
