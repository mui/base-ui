import type * as React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: './',
    types: { 'application/rss+xml': '/blog/rss.xml' },
  },
};

export default function BlogLayout({ children }: React.PropsWithChildren) {
  return children;
}
