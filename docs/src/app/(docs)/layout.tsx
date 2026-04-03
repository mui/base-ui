import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';
import { GoogleAnalytics } from 'docs/src/components/GoogleAnalytics';
import { DocsProviders } from 'docs/src/components/DocsProviders';
import * as SideNav from 'docs/src/components/SideNav';
import * as QuickNav from 'docs/src/components/QuickNav/QuickNav';
import { Header, titleMap } from 'docs/src/components/Header';
import { MAIN_CONTENT_ID } from 'docs/src/components/SkipNav';
import { sitemap } from 'docs/src/app/sitemap';
import 'docs/src/css/index.css';
import './layout.css';

const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    // Use suppressHydrationWarning to avoid https://github.com/facebook/react/issues/24430
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
                      {sitemap &&
                        Object.entries(sitemap.data).map(([name, section]) => (
                          <SideNav.Section key={name}>
                            <SideNav.Heading>{name}</SideNav.Heading>
                            <SideNav.List>
                              {section.pages
                                .filter((page) =>
                                  page.audience === 'private' ? showPrivatePages : true,
                                )
                                .map((page) => {
                                  const isNewPage = page.tags?.includes('New');
                                  const isPreviewPage = page.tags?.includes('Preview');
                                  const isPrivatePage = page.audience === 'private';

                                  return (
                                    <SideNav.Item
                                      key={page.title}
                                      href={
                                        page.path.startsWith('./')
                                          ? `${section.prefix}${page.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
                                          : page.path
                                      }
                                      external={page.tags?.includes('External')}
                                    >
                                      {(page.title && titleMap[page.title]) || page.title}
                                      {isPrivatePage && <SideNav.Badge>Private</SideNav.Badge>}
                                      {isPreviewPage && <SideNav.Badge>Preview</SideNav.Badge>}
                                      {isNewPage && !isPreviewPage && !isPrivatePage && (
                                        <SideNav.Badge>New</SideNav.Badge>
                                      )}
                                    </SideNav.Item>
                                  );
                                })}
                            </SideNav.List>
                          </SideNav.Section>
                        ))}
                    </SideNav.Root>

                    <main className="ContentLayoutMain" id={MAIN_CONTENT_ID}>
                      <QuickNav.Container>{children}</QuickNav.Container>
                    </main>
                  </div>
                </div>
                <span className="RootLayoutFooter" />
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
