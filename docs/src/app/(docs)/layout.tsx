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

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    // Use suppressHydrationWarning to avoid https://github.com/facebook/react/issues/24430
    <html lang="en">
      <head>
        <link
          rel="preload"
          href={new URL('../../css/fonts/regular.woff2', import.meta.url).toString()}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href={new URL('../../css/fonts/medium.woff2', import.meta.url).toString()}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href={new URL('../../css/fonts/bold.woff2', import.meta.url).toString()}
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
                        Object.entries(
                          sitemap.data as Record<
                            string,
                            {
                              title?: string;
                              prefix?: string;
                              pages: {
                                title: string;
                                tags?: string[];
                                isNew?: boolean;
                                isPreview?: boolean;
                                path: string;
                              }[];
                            }
                          >,
                        ).map(([name, section]) => (
                          <SideNav.Section key={name}>
                            <SideNav.Heading>{name}</SideNav.Heading>
                            <SideNav.List>
                              {section.pages.map((page) => {
                                const isNew = page.isNew ?? page.tags?.includes('New');
                                const isPreview = page.isPreview ?? page.tags?.includes('Preview');

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
                                    {titleMap[page.title] || page.title}
                                    {isPreview && <SideNav.Badge>Preview</SideNav.Badge>}
                                    {isNew && !isPreview && <SideNav.Badge>New</SideNav.Badge>}
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
    type: 'website',
    locale: 'en_US',
    title: {
      template: '%s · Base UI',
      default: 'Base UI',
    },
    ttl: 604800,
  },
  metadataBase: new URL('https://base-ui.com'),
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
