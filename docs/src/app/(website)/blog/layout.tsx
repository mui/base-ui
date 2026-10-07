import * as React from 'react';
import type { Metadata } from 'next';

export default function BlogLayout({ children }: React.PropsWithChildren) {
  return <React.Fragment>{children}</React.Fragment>;
}

export const metadata: Metadata = {
  title: null,
  openGraph: { type: 'article' },
};
