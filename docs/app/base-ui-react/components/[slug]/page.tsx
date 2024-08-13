import * as React from 'react';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage } from 'docs-base/src/utils/getMarkdownPage';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import routes, { getSlugs } from 'docs-base/data/base/pages';
import { AppBar } from 'docs-base/src/modules/common/AppBar';
import { Navigation } from 'docs-base/src/modules/common/Navigation';
import {
  ApiReference,
  getApiReferenceTableOfContents,
} from 'docs-base/src/modules/components/ApiReference';
import { getApiReferenceData } from 'docs-base/src/utils/getApiReferenceData';
import classes from '../../styles.module.css';

interface Props {
  params: {
    slug: string;
  };
}

export default async function ComponentPage(props: Props) {
  const {
    params: { slug },
  } = props;
  const { MDXContent, metadata, tableOfContents } = await getMarkdownPage('components', slug);

  const documentedComponents = metadata.components?.split(',').map((c) => c.trim()) ?? [];
  const componentsApi = await getApiReferenceData(documentedComponents);
  const apiReferenceToc = getApiReferenceTableOfContents(componentsApi);

  tableOfContents[0].children?.push(apiReferenceToc);

  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main className={classes.content}>
        <MDXContent components={components} />
        <ApiReference componentsApi={componentsApi} />
      </main>

      <TableOfContents toc={tableOfContents} renderDepth={3} />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  return getSlugs('/base-ui-react/components').map((slug) => ({ slug }));
}
