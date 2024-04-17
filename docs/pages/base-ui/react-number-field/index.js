import * as React from 'react';
import MarkdownDocs from 'docs-base/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs-base/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/number-field/number-field.md?@mui/markdown';

export default function Page(props) {
  const { userLanguage, ...other } = props;
  return <MarkdownDocs {...pageProps} {...other} />;
}

Page.getLayout = (page) => {
  return <AppFrame>{page}</AppFrame>;
};
