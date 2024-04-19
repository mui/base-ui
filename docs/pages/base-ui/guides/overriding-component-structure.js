import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import * as pageProps from 'docs-base/data/base/guides/overriding-component-structure/overriding-component-structure.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs {...pageProps} />;
}
