import * as React from 'react';
import { getMDXComponent } from 'mdx-bundler/client';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage } from 'docs-base/src/utils/getMarkdownPage';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import { getSlugs } from 'docs-base/data/base/pages';
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
  const page = await getMarkdownPage(slug[0], slug[1]);

  const MarkdownContent = getMDXComponent(page.code);

  return (
    <React.Fragment>
      <div className={classes.content}>
        <MarkdownContent components={components} />
      </div>

      <TableOfContents />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  return getSlugs('/base-ui-react/getting-started').map((slug) => ({
    slug: ['getting-started', slug],
  }));
}
