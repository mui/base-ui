import * as React from 'react';
import Script from 'next/script';

// TODO: Move to @mui/docs

interface GoogleTagManagerProps {
  id: string;
}

export function GoogleTagManager(props: React.PropsWithChildren<GoogleTagManagerProps>) {
  const { id } = props;
  return (
    <React.Fragment>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${id}', {
  send_page_view: false,
});
`,
        }}
      />
      {/**
       * A better alternative to <script async>, to delay its execution
       * https://developer.chrome.com/blog/script-component/
       */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />
    </React.Fragment>
  );
}
