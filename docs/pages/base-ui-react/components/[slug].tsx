import * as React from 'react';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import { getMDXComponent } from 'mdx-bundler/client';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage } from 'docs-base/src/utils/getMarkdownPage';
import { MasterLayout } from 'docs-base/src/layout/MasterLayout';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import { getSlugs } from 'docs-base/data/base/pages';
import { ApiReference } from 'docs-base/src/modules/components/ApiReference';
import { getApiReferenceData } from 'docs-base/src/utils/getApiReferenceData';
import classes from './styles.module.css';

export default function ComponentPage(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { content } = props;
  const MarkdownContent = React.useMemo(() => {
    return getMDXComponent(content);
  }, [content]);

  if (!props.metadata) {
    return null;
  }

  return (
    <React.Fragment>
      <Head>
        <title>{props.metadata.title}</title>
      </Head>

      <div className={classes.content}>
        <MarkdownContent components={components} />
        <ApiReference componentsApi={props.componentsApi} />
      </div>

      <TableOfContents />
    </React.Fragment>
  );
}

export const getStaticProps = (async (context) => {
  const { params } = context;

  if (params?.slug == null) {
    throw new Error('No slug provided');
  }

  const page = await getMarkdownPage('components', params.slug as string);
  const documentedComponents = page.metadata.components?.split(',').map((c) => c.trim()) ?? [];
  const componentsApi = await getApiReferenceData(documentedComponents);

  return {
    props: {
      slug: context?.params?.slug ?? '',
      metadata: page.metadata,
      content: page.code,
      componentsApi,
    },
  };
}) satisfies GetStaticProps;

export const getStaticPaths = (() => {
  return {
    paths: getSlugs('/base-ui-react/components').map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}) satisfies GetStaticPaths;

ComponentPage.getLayout = function getLayout(page: React.ReactNode) {
  return <MasterLayout>{page}</MasterLayout>;
};
