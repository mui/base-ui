import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';

export default function Layout({ children }: React.PropsWithChildren) {
  return children;
}

const description = 'Unstyled UI components for building accessible web apps and design systems.';

export const metadata: Metadata = {
  title: {
    template: '%s · Base UI',
    default: 'Base UI',
  },
  description,
  metadataBase: new URL('https://base-ui.com'),
  twitter: {
    site: '@base_ui',
    card: 'summary_large_image',
    description,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: {
      template: '%s · Base UI',
      default: 'Base UI',
    },
    description,
  },
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
