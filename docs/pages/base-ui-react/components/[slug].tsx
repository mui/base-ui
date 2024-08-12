/* eslint-disable react/no-danger */
import * as React from 'react';
import { readFile } from 'node:fs/promises';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import kebabCase from 'lodash/kebabCase';
import { getMDXComponent } from 'mdx-bundler/client';
import { components } from 'docs-base/src/modules/common/MDXComponents';
import { getMarkdownPage } from 'docs-base/src/utils/getMarkdownPage';
import { MasterLayout } from 'docs-base/src/layout/MasterLayout';
import { TableOfContents } from 'docs-base/src/modules/common/TableOfContents';
import { getSlugs } from 'docs-base/data/base/pages';
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

        <h2>API Reference</h2>
        <div>
          {props.componentsApi.map((apiDescription) => (
            <React.Fragment key={apiDescription.name}>
              <h3>{apiDescription.name}</h3>
              <p dangerouslySetInnerHTML={{ __html: apiDescription.description }} />
              <table>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {apiDescription.props.map((prop) => (
                    <tr key={prop.name}>
                      <td>{prop.name}</td>
                      <td>{prop.type.name}</td>
                      <td>{prop.default}</td>
                      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                      <td dangerouslySetInnerHTML={{ __html: prop.description }} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </React.Fragment>
          ))}
        </div>
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

  const componentsApi = await Promise.all(
    documentedComponents.map(async (componentName) => {
      const kebabedComponentName = kebabCase(componentName);
      const apiDescriptionFilePath = `data/base/api/${kebabedComponentName}.json`;
      const translationsFilePath = `data/base/translations/api-docs/${kebabedComponentName}/${kebabedComponentName}.json`;

      const apiDescription = JSON.parse(await readFile(apiDescriptionFilePath, 'utf-8'));
      const translations = JSON.parse(await readFile(translationsFilePath, 'utf-8'));

      return {
        name: componentName,
        description: translations.componentDescription,
        props: Object.keys(apiDescription.props).map((propName) => ({
          name: propName,
          ...apiDescription.props[propName],
          ...translations.propDescriptions[propName],
        })),
      };
    }),
  );

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
