import * as React from 'react';
import { Metadata } from 'next';
import { components } from 'docs-base/src/components/content/MDXComponents';
import { getMarkdownPage, getMarkdownPageMetadata } from 'docs-base/app/(content)/getMarkdownPage';
import { TableOfContents } from 'docs-base/src/components/TableOfContents';
import routes, { getSlugs } from 'docs-base/data/pages';
import { AppBar } from 'docs-base/src/components/AppBar';
import { Navigation } from 'docs-base/src/components/Navigation';
import { Description } from 'docs-base/src/components/content/Description';
import { SiblingPageLinks } from 'docs-base/src/components/SiblingPageLinks';
import { EditPageGithubLink } from 'docs-base/src/components/EditPageGithhubLink';
import classes from '../../styles.module.css';

const CATEGORY_SEGMENT = 'guides';

interface Props {
  params: {
    slug: string;
  };
}

export default async function DocsPage(props: Props) {
  const {
    params: { slug },
  } = props;

  const { MDXContent, tableOfContents, metadata } = await getMarkdownPage(CATEGORY_SEGMENT, slug);

  const allComponents = {
    ...components,
    // eslint-disable-next-line react/no-unstable-nested-components
    Description: () => <Description text={metadata.description} />,
    Demo: () => null,
  };

  return (
    <React.Fragment>
      <AppBar />
      <Navigation routes={routes} />
      <main className={classes.content}>
        <MDXContent components={allComponents} />
        <div>
          <div className={classes.editLink}>
            <EditPageGithubLink category={CATEGORY_SEGMENT} slug={slug} />
          </div>
          <div>
            <SiblingPageLinks currentSlug={`/${CATEGORY_SEGMENT}/${slug}`} pages={routes} />
          </div>
        </div>
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
  const { title = 'Guides', description } = await getMarkdownPageMetadata(CATEGORY_SEGMENT, slug);

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
