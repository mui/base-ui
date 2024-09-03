import * as React from 'react';
import { Metadata } from 'next';
import { GoogleAnalytics } from 'docs-base/src/components/GoogleAnalytics';
import { DocsProviders } from './DocsProviders';
import '../src/styles/style.css';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="manifest" href="/static/manifest.json" />
        <link rel="shortcut icon" href="/static/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/static/icons/180x180.png" />
      </head>
      <body>
        <DocsProviders>
          {children}
          <GoogleAnalytics />
        </DocsProviders>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s · Base UI',
    default: 'Base UI',
  },
  twitter: {
    site: '@Base_UI',
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
};
