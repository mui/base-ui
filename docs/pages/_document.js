import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { GoogleAnalyticsScriptLoader } from 'docs-base/src/modules/common/GoogleAnalyticsScriptLoader';

const PRODUCTION_GA =
  process.env.DEPLOY_ENV === 'production' || process.env.DEPLOY_ENV === 'staging';

const GOOGLE_ANALYTICS_ID_V4 = PRODUCTION_GA ? 'G-5NXDQLC2ZK' : 'G-XJ83JQEK7J';

const ROOT_ADDRESS = 'https://base-ui.dev';

export default class MyDocument extends Document {
  render() {
    const { canonicalAsServer, userLanguage } = this.props;

    return (
      <Html lang={userLanguage} data-mui-color-scheme="light" data-joy-color-scheme="light">
        <Head>
          <link rel="manifest" href="/static/manifest.json" />
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/static/icons/180x180.png" />
          <link
            rel="canonical"
            href={`${ROOT_ADDRESS}${
              userLanguage === 'en' ? '' : `/${userLanguage}`
            }${canonicalAsServer}`}
          />
          <link rel="alternate" href={`${ROOT_ADDRESS}${canonicalAsServer}`} hrefLang="x-default" />
        </Head>
        <body>
          <Main />
          <GoogleAnalyticsScriptLoader id={GOOGLE_ANALYTICS_ID_V4} />
          <NextScript />
        </body>
      </Html>
    );
  }
}
