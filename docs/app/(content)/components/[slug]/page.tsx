import * as React from 'react';
import { Metadata } from 'next';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage, getMarkdownPageMetadata } from 'docs-base/src/utils/getMarkdownPage';
import { Description } from 'docs-base/src/modules/components';
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

const CATEGORY_SEGMENT = 'components';

interface Props {
  params: {
    slug: string;
  };
}

function componentNameFromSlug(slug: string) {
  return slug.replace('react-', '');
}

export default async function ComponentPage(props: Props) {
  const {
    params: { slug },
  } = props;

  const componentName = componentNameFromSlug(slug);

  const { MDXContent, metadata, tableOfContents } = await getMarkdownPage(
    CATEGORY_SEGMENT,
    componentName,
  );

  const documentedComponents = metadata.components?.split(',').map((c: string) => c.trim()) ?? [];
  const componentsApi = await getApiReferenceData(documentedComponents);
  const apiReferenceToc = getApiReferenceTableOfContents(componentsApi);

  tableOfContents[0].children?.push(apiReferenceToc);

  const allComponents = {
    ...components,
    // eslint-disable-next-line react/no-unstable-nested-components
    Demo: (demoProps: Omit<DemoProps, 'componentName'>) => (
      <Demo componentName={componentName} {...demoProps} />
    ),
    // eslint-disable-next-line react/no-unstable-nested-components
    Description: () => <Description text={metadata.description} />,
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
  return getSlugs(`/${CATEGORY_SEGMENT}`).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
