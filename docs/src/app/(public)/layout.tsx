import * as React from 'react';
import type { Metadata } from 'next/types';
import { GoogleAnalytics } from 'docs/src/components/GoogleAnalytics';
import { DocsProviders } from 'docs/src/components/DocsProviders';
import 'docs/src/styles.css';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <DocsProviders>
      <div className="RootLayout">
        <div className="RootLayoutContainer">
          <div className="RootLayoutContent">{children}</div>
        </div>
      </div>
      <GoogleAnalytics />
    </DocsProviders>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL('https://base-ui.com'),
};
