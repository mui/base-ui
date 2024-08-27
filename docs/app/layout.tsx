import * as React from 'react';
import { Metadata } from 'next';
import configureSandboxDependencies from 'docs-base/src/utils/configureSandboxDependencies';
import { GoogleTagManager } from 'docs-base/src/modules/common/GoogleTagManager';
import { GoogleAnalytics } from 'docs-base/src/modules/common/GoogleAnalytics';
import * as Tooltip from '@base_ui/react/Tooltip';
import '../src/styles/style.css';

configureSandboxDependencies();

const PRODUCTION_GA =
  process.env.DEPLOY_ENV === 'production' || process.env.DEPLOY_ENV === 'staging';

const GOOGLE_ANALYTICS_ID_V4 = PRODUCTION_GA ? 'G-5NXDQLC2ZK' : 'G-XJ83JQEK7J';

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
        <meta name="mui:productId" content="base-ui" />
        <meta name="mui:productCategoryId" content="core" />
      </head>
      <body>
        <Tooltip.Provider delay={350}>{children}</Tooltip.Provider>
        <GoogleAnalytics />
        <GoogleTagManager id={GOOGLE_ANALYTICS_ID_V4} />
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
