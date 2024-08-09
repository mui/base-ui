import * as React from 'react';
import { getMDXComponent } from 'mdx-bundler/client';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { getMdxPage } from 'docs-base/src/utils/getMdxPage';
import { MasterLayout } from 'docs-base/src/layout/MasterLayout';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import { getSlugs } from 'docs-base/data/base/pages';

const components = {
  Demo: () => <div>demo goes here</div>,
  ComponentLinkHeader: () => <div>component link header goes here</div>,
  ComponentPageTabs: () => null,
};

export default function ComponentPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { content } = props;
  const Component = React.useMemo(() => {
    return getMDXComponent(content);
  }, [content]);

  if (!props.metadata) {
    return null;
  }

  return (
    <main>
      <h1>{props.metadata.title}</h1>
      <TableOfContents />
      <Component components={components} />
    </main>
  );
}

export const getStaticProps = (async (context) => {
  const { params } = context;

  if (params?.slug == null) {
    throw new Error('No slug provided');
  }

  const page = await getMdxPage('getting-started', params.slug as string);

  return {
    props: {
      slug: context?.params?.slug ?? '',
      metadata: page.metadata,
      content: page.code,
    },
  };
}) satisfies GetStaticProps;

export const getStaticPaths = (() => {
  return {
    paths: getSlugs('/base-ui-react/getting-started').map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}) satisfies GetStaticPaths;

ComponentPage.getLayout = function getLayout(page: React.ReactNode) {
  return <MasterLayout>{page}</MasterLayout>;
};
