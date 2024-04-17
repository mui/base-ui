import * as React from 'react';
import MarkdownDocs from 'docs-base/src/modules/components/MarkdownDocs';
import * as pageProps from 'docs-base/data/base/guides/next-js-app-router/next-js-app-router.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs {...pageProps} />;
}
