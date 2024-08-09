import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { GoogleTagManager } from 'docs-base/src/modules/common/GoogleAnalyticsScriptLoader';

const PRODUCTION_GA =
  process.env.DEPLOY_ENV === 'production' || process.env.DEPLOY_ENV === 'staging';

const GOOGLE_ANALYTICS_ID_V4 = PRODUCTION_GA ? 'G-5NXDQLC2ZK' : 'G-XJ83JQEK7J';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <link rel="manifest" href="/static/manifest.json" />
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/static/icons/180x180.png" />
          <meta name="mui:productId" content="base-ui" />
          <meta name="mui:productCategoryId" content="core" />
        </Head>
        <body>
          <Main />
          <GoogleTagManager id={GOOGLE_ANALYTICS_ID_V4} />
          <NextScript />
        </body>
      </Html>
    );
  }
}
