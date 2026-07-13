// Keep CSS imports first to ensure CSS layer order is correct
import 'docs/src/css/index.css';
import './layout.css';

import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';
import { GoogleAnalytics } from 'docs/src/components/GoogleAnalytics';
import { DocsProviders } from 'docs/src/components/DocsProviders';
import * as SideNav from 'docs/src/components/SideNav';
import { SideNavContent } from 'docs/src/components/SideNavContent';
import * as QuickNav from 'docs/src/components/QuickNav/QuickNav';
import { Header } from 'docs/src/components/Header';
import { MAIN_CONTENT_ID } from 'docs/src/components/SkipNav';
import { sitemap } from 'docs/src/app/sitemap';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    // Use suppressHydrationWarning to avoid https://github.com/react/react/issues/24430
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/die-grotesk-a-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/die-grotesk-a-bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/die-grotesk-b-bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/paper-mono.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <GoogleAnalytics>
          <DocsProviders>
            <div className="RootLayout">
              <div className="RootLayoutContainer">
                <div className="RootLayoutContent">
                  <div className="ContentLayoutRoot">
                    <Header />
                    <SideNav.Root>
                      <SideNavContent sitemap={sitemap} />
                    </SideNav.Root>

                    <main className="ContentLayoutMain" id={MAIN_CONTENT_ID}>
                      <QuickNav.Container>{children}</QuickNav.Container>
                    </main>
                  </div>
                </div>
              </div>
            </div>
          </DocsProviders>
        </GoogleAnalytics>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  // Title and description are pulled from <h1> and <Subtitle> in the MDX.
  title: null,
  description: null,
  twitter: {
    site: '@base_ui',
    card: 'summary_large_image',
  },
  openGraph: {
    // 'article' is more semantically correct for documentation pages and
    // unlocks article-specific OG properties.
    type: 'article',
    locale: 'en_US',
    url: './',
    authors: ['https://base-ui.com'],
    ttl: 604800,
  },
  metadataBase: process.env.BASE_URL,
  alternates: {
    canonical: './',
  },
  icons: {
    // Based on https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
    icon: [
      {
        rel: 'icon',
        url:
          process.env.NODE_ENV !== 'production' ? '/static/favicon-dev.ico' : '/static/favicon.ico',
        sizes: '32x32',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        url:
          process.env.NODE_ENV !== 'production' ? '/static/favicon-dev.svg' : '/static/favicon.svg',
      },
    ],
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/static/apple-touch-icon.png',
      },
    ],
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
  themeColor: [
    // Safari header background: match the page background (--color-content)
    {
      media: '(prefers-color-scheme: light)',
      color: 'white',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: 'black',
    },
  ],
};
