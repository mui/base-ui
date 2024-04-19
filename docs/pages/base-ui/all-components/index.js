import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/all-components/all-components.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs {...pageProps} disableToc />;
}

Page.getLayout = (page) => {
  return <AppFrame>{page}</AppFrame>;
};
