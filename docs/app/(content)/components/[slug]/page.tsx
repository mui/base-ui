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
import { Demo, DemoProps } from 'docs-base/src/modules/components/Demo';
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

  const componentName = slug.replace('react-', '');

  const { MDXContent, metadata, tableOfContents } = await getMarkdownPage(
    'components',
    componentName,
  );

  const documentedComponents = metadata.components?.split(',').map((c: string) => c.trim()) ?? [];
  const componentsApi = await getApiReferenceData(documentedComponents);
  const apiReferenceToc = getApiReferenceTableOfContents(componentsApi);

  tableOfContents[0].children?.push(apiReferenceToc);

  const allComponents = {
    ...components,
    // eslint-disable-next-line react/no-unstable-nested-components
    Demo: (demoProps: Omit<DemoProps, 'componentName'>) => {
      return <Demo componentName={componentName} {...demoProps} />;
    },
  };

  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main className={classes.content}>
        <MDXContent components={{ ...allComponents }} />
        <ApiReference componentsApi={componentsApi} />
      </main>

      <TableOfContents toc={tableOfContents} renderDepth={3} />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  return getSlugs('/components').map((slug) => ({ slug }));
}
