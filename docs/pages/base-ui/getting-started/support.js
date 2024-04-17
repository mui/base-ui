import * as React from 'react';
import MarkdownDocs from 'docs-base/src/modules/components/MarkdownDocs';
import * as pageProps from 'docs-base/data/base/getting-started/support/support.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs {...pageProps} disableAd />;
}
