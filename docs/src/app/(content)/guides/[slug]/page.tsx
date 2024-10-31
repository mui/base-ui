import * as React from 'react';
import { Metadata } from 'next';
import { components } from 'docs/src/components/content/MDXComponents';
import {
  getMarkdownPage,
  getMarkdownPageMetadata,
} from 'docs/src/app/(content)/getMarkdownPage';
import { TableOfContents } from 'docs/src/components/TableOfContents';
import routes, { getSlugs } from 'docs/data/pages';
import { Description } from 'docs/src/components/content/Description';
import { SiblingPageLinks } from 'docs/src/components/SiblingPageLinks';
import { EditPageGithubLink } from 'docs/src/components/EditPageGithubLink';

const CATEGORY_SEGMENT = 'guides';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DocsPage(props: Props) {
  const { slug } = await props.params;
  const { MDXContent, tableOfContents, metadata } = await getMarkdownPage(
    CATEGORY_SEGMENT,
    slug,
  );

  const allComponents = {
    ...components,
    // eslint-disable-next-line react/no-unstable-nested-components
    Description: () => <Description text={metadata.description} />,
    Demo: () => null,
  };

  return (
    <React.Fragment>
      <main className="Content">
        <MDXContent components={allComponents} />
        <div>
          <div className="EditLink">
            <EditPageGithubLink category={CATEGORY_SEGMENT} slug={slug} />
          </div>
          <div>
            <SiblingPageLinks
              currentSlug={`/${CATEGORY_SEGMENT}/${slug}`}
              pages={routes}
            />
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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const { title = 'Guides', description } = await getMarkdownPageMetadata(
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
