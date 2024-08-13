import * as React from 'react';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage } from 'docs-base/src/utils/getMarkdownPage';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import { getSlugs } from 'docs-base/data/base/pages';
import { ApiReference } from 'docs-base/src/modules/components/ApiReference';
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
  const { MDXContent, metadata } = await getMarkdownPage('components', slug);

  const documentedComponents = metadata.components?.split(',').map((c) => c.trim()) ?? [];
  const componentsApi = await getApiReferenceData(documentedComponents);

  return (
    <React.Fragment>
      <div className={classes.content}>
        <MDXContent components={components} />
        <ApiReference componentsApi={componentsApi} />
      </div>

      <TableOfContents />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  return getSlugs('/base-ui-react/components').map((slug) => ({ slug }));
}
