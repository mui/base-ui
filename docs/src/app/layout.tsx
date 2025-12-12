import * as React from 'react';
import type { Metadata, Viewport } from 'next/types';

export default function Layout({ children }: React.PropsWithChildren) {
  return children;
}

export const metadata: Metadata = {
  metadataBase: new URL('https://base-ui.com'),
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
