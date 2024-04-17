import * as React from 'react';
import MarkdownDocs from 'docs-base/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs-base/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/getting-started/overview/overview.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs {...pageProps} disableAd />;
}

Page.getLayout = (page) => {
  return <AppFrame>{page}</AppFrame>;
};
