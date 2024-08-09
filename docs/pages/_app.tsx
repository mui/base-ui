import 'docs/src/modules/components/bootstrap';
// --- Post bootstrap -----
import * as React from 'react';
import { AppProps } from 'next/app';
import GoogleAnalytics from 'docs/src/modules/components/GoogleAnalytics';
import configureSandboxDependencies from 'docs-base/src/utils/configureSandboxDependencies';
import '../src/styles/style.css';
import { NextPage } from 'next';

configureSandboxDependencies();

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function BaseUIDocsApp(props: AppPropsWithLayout) {
  const { Component, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <React.Fragment>
      {getLayout(<Component {...pageProps} />)}
      <GoogleAnalytics />
    </React.Fragment>
  );
}

// Track fraction of actual events to prevent exceeding event quota.
// Filter sessions instead of individual events so that we can track multiple metrics per device.
// See https://github.com/GoogleChromeLabs/web-vitals-report to use this data
const disableWebVitalsReporting = Math.random() > 0.0001;

// @ts-ignore
export function reportWebVitals({ id, name, label, delta, value }) {
  if (disableWebVitalsReporting) {
    return;
  }
  // @ts-ignore
  window.gtag('event', name, {
    value: delta,
    metric_label: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    metric_value: value,
    metric_delta: delta,
    metric_id: id, // id unique to current page load
  });
}
