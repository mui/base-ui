import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import * as pageProps from 'docs-base/data/base/getting-started/support/support.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs {...pageProps} disableAd />;
}
