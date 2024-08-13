import * as React from 'react';
import configureSandboxDependencies from 'docs-base/src/utils/configureSandboxDependencies';
import { AppBar } from 'docs-base/src/modules/common/AppBar';
import { Navigation } from 'docs-base/src/modules/common/Navigation';
import { GoogleTagManager } from 'docs-base/src/modules/common/GoogleTagManager';
import { GoogleAnalytics } from 'docs-base/src/modules/common/GoogleAnalytics';
import routes from 'docs-base/data/base/pages';
import classes from './layout.module.css';
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
        {children}
        <GoogleAnalytics />
        <GoogleTagManager id={GOOGLE_ANALYTICS_ID_V4} />
      </body>
    </html>
  );
}
