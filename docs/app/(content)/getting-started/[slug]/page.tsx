import * as React from 'react';
import { Metadata } from 'next';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage, getMarkdownPageMetadata } from 'docs-base/src/utils/getMarkdownPage';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import routes, { getSlugs } from 'docs-base/data/base/pages';
import { AppBar } from 'docs-base/src/modules/common/AppBar';
import { Navigation } from 'docs-base/src/modules/common/Navigation';
import classes from '../../styles.module.css';

const CATEGORY_SEGMENT = 'getting-started';

interface Props {
  params: {
    slug: string;
  };
}

export default async function DocsPage(props: Props) {
  const {
    params: { slug },
  } = props;

  const { MDXContent, tableOfContents } = await getMarkdownPage(CATEGORY_SEGMENT, slug);

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
  return getSlugs(`/${CATEGORY_SEGMENT}`).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const { title = 'Getting started', description } = await getMarkdownPageMetadata(
    CATEGORY_SEGMENT,
    slug,
  );

  return {
    title,
    description,
    twitter: {
      title,
      description,
    },
    openGraph: {
      title,
      description,
    },
  };
}
