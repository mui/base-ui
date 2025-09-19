import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';
import { GoogleAnalytics } from 'docs/src/components/GoogleAnalytics';
import { DocsProviders } from 'docs/src/components/DocsProviders';
import 'docs/src/styles.css';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <DocsProviders>
      <div className="RootLayout">
        <div className="RootLayoutContainer">
          <div className="RootLayoutContent">{children}</div>
          <span className="RootLayoutFooter" />
        </div>
      </div>
      <GoogleAnalytics />
    </DocsProviders>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL('https://base-ui.com'),
};

export const viewport: Viewport = {
  themeColor: [
    // Desktop Safari page background
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
