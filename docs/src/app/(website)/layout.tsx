import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';
import { GoogleAnalytics } from 'docs/src/components/GoogleAnalytics';
import './fonts/index.css';
import './css/index.css';
import './css/components/Accordion.css';
import './css/components/Body.css';
import './css/components/Button.css';
import './css/components/Figure.css';
import './css/components/Icon.css';
import './css/components/Key.css';
import './css/components/Link.css';
import './css/components/List.css';
import './css/components/Menu.css';
import './css/components/Popup.css';
import './css/components/Separator.css';
import './css/components/Text.css';
import './css/utilities/align-items.css';
import './css/utilities/box-sizing.css';
import './css/utilities/display.css';
import './css/utilities/flex-direction.css';
import './css/utilities/flex-wrap.css';
import './css/utilities/font-weight.css';
import './css/utilities/gap.css';
import './css/utilities/grid-auto-rows.css';
import './css/utilities/grid-column-end.css';
import './css/utilities/grid-column-start.css';
import './css/utilities/grid-template-columns.css';
import './css/utilities/height.css';
import './css/utilities/justify-content.css';
import './css/utilities/left.css';
import './css/utilities/padding.css';
import './css/utilities/position.css';
import './css/utilities/text-align.css';
import './css/utilities/top.css';
import './css/utilities/transform.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="Body">{children}</body>
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
      color: '#000',
    },
  ],
};
