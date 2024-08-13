import * as React from 'react';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage } from 'docs-base/src/utils/getMarkdownPage';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import routes, { getSlugs } from 'docs-base/data/base/pages';
import { AppBar } from 'docs-base/src/modules/common/AppBar';
import { Navigation } from 'docs-base/src/modules/common/Navigation';
import classes from '../styles.module.css';

interface Props {
  params: {
    slug: string[];
  };
}

export default async function DocsPage(props: Props) {
  const {
    params: { slug },
  } = props;
  const { MDXContent, tableOfContents } = await getMarkdownPage(slug[0], slug[1]);

  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main className={classes.content}>
        <MDXContent components={components} />
      </main>

      <TableOfContents toc={tableOfContents} />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  return getSlugs('/base-ui-react/getting-started').map((slug) => ({
    slug: ['getting-started', slug],
  }));
}
