import * as React from 'react';
import { Metadata } from 'next';
import { components } from 'docs/src/components/content/MDXComponents';
import {
  getMarkdownPage,
  getMarkdownPageMetadata,
} from 'docs/src/app/(content)/getMarkdownPage';
import { ComponentLinkHeader } from 'docs/src/components/content/ComponentLinkHeader';
import { Description } from 'docs/src/components/content/Description';
import { TableOfContents } from 'docs/src/components/TableOfContents';
import routes, { getSlugs } from 'docs/data/pages';
import { SiblingPageLinks } from 'docs/src/components/SiblingPageLinks';
import { EditPageGithubLink } from 'docs/src/components/EditPageGithubLink';
import {
  ApiReference,
  getApiReferenceTableOfContents,
} from 'docs/src/components/ApiReference';
import { DemoLoader, DemoLoaderProps } from 'docs/src/components/demo/DemoLoader';
import { getApiReferenceData } from './getApiReferenceData';

const CATEGORY_SEGMENT = 'components';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

function componentNameFromSlug(slug: string) {
  return slug.replace('react-', '');
}

export default async function ComponentPage(props: Props) {
  const { slug } = await props.params;
  const componentName = componentNameFromSlug(slug);

  const { MDXContent, metadata, tableOfContents } = await getMarkdownPage(
    CATEGORY_SEGMENT,
    componentName,
  );

  const documentedComponents =
    metadata.components?.split(',').map((c: string) => c.trim()) ?? [];
  const componentsApi = await getApiReferenceData(documentedComponents);
  const apiReferenceToc = getApiReferenceTableOfContents(componentsApi);

  tableOfContents[0].children?.push(apiReferenceToc);

  const allComponents = {
    ...components,
    // eslint-disable-next-line react/no-unstable-nested-components
    Demo: (demoProps: Omit<DemoLoaderProps, 'componentName'>) => (
      <div className="my-5">
        <DemoLoader componentName={componentName} {...demoProps} />
      </div>
    ),
    // eslint-disable-next-line react/no-unstable-nested-components
    Description: () => <Description text={metadata.description} />,
    // eslint-disable-next-line react/no-unstable-nested-components
    ComponentLinkHeader: () => (
      <ComponentLinkHeader
        ariaSpecUrl={metadata.waiAria}
        githubLabel={metadata.githubLabel}
      />
    ),
  };

  return (
    <React.Fragment>
      <main className="Content">
        <MDXContent components={{ ...allComponents }} />
        <ApiReference componentsApi={componentsApi} />
        <div>
          <div className="EditLink">
            <EditPageGithubLink category={CATEGORY_SEGMENT} slug={componentName} />
          </div>
          <div>
            <SiblingPageLinks
              currentSlug={`/${CATEGORY_SEGMENT}/${slug}`}
              pages={routes}
            />
          </div>
        </div>
      </main>

      <TableOfContents toc={tableOfContents} renderDepth={3} />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  return getSlugs(`/${CATEGORY_SEGMENT}`).map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;
  const componentName = componentNameFromSlug(slug);
  const { title = 'Components', description } = await getMarkdownPageMetadata(
    CATEGORY_SEGMENT,
    componentName,
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
