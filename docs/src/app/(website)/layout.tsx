import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';
import { GoogleAnalytics } from 'docs/src/components/GoogleAnalytics';
import { Link } from 'docs/src/components/Link';
import { Logo } from 'docs/src/components/Logo';
import './fonts/index.css';
import './css/index.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    // Use suppressHydrationWarning to avoid https://github.com/facebook/react/issues/24430
    <html lang="en">
      <body suppressHydrationWarning className="Body p-6 bp2:py-7 bp2:px-9">
        <div
          className="bs-bb d-g gtc-8 g-8 bp2:g-9"
          style={{ maxWidth: '1480px', marginInline: 'auto' }}
        >
          <header className="d-c">
            <div className="gcs-1 gce-4">
              <Logo aria-label="Base UI" />
            </div>
            <nav
              className="d-f fd-c g-2 gcs-5 gce-8 bp2:gcs-5 bp2:gce-9 bp3:gcs-5 bp3:gce-7"
              aria-label="social links"
            >
              <a className="Text size-1 Link" href="https://x.com/base_ui">
                X
              </a>
              <a className="Text size-1 Link" href="https://github.com/mui/base-ui">
                GitHub
              </a>
              <a className="Text size-1 Link" href="https://discord.com/invite/g6C3hUtuxz">
                Discord
              </a>
            </nav>
            <div className="d-n bp3:d-b gcs-7 gce-9">
              <Link className="Text size-1 Link" href="/react/components/accordion">
                Components
              </Link>
            </div>
          </header>
          <main id="main" className="d-c">
            {children}
          </main>
          <div className="gcs-1 gce-9 bp3:gcs-3">
            <div className="Separator" role="separator" aria-hidden="true"></div>
          </div>
          <footer className="d-c">
            <div className="gcs-1 gce-9 bp2:gce-3">
              <span className="Text size-1">© Base UI</span>
            </div>
            <nav className="d-f fd-c g-2 gcs-1 gce-9 bp2:gcs-3 bp4:gce-7" aria-label="social links">
              <a className="Text size-1 Link" href="https://x.com/base_ui">
                X
              </a>
              <a className="Text size-1 Link" href="https://github.com/mui/base-ui">
                GitHub
              </a>
              <a className="Text size-1 Link" href="https://discord.com/invite/g6C3hUtuxz">
                Discord
              </a>
              <a className="Text size-1 Link" href="https://www.npmjs.com/package/@base-ui/react">
                npm
              </a>
              <a
                className="Text size-1 Link"
                href="https://bsky.app/profile/did:plc:nwr6peuxqzdzlbi72qr5kldc"
              >
                Bluesky
              </a>
            </nav>
          </footer>
        </div>
      </body>
      <GoogleAnalytics />
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s · Base UI',
    default: 'Base UI',
  },
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
    // Mobile Safari header background (match the page content)
    {
      media: '(prefers-color-scheme: light)',
      color: '#FFF',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: 'hsl(0deg 0% 6%)',
    },
  ],
};
