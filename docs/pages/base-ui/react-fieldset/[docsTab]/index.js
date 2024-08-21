import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/fieldset/fieldset.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import FieldsetLegendApiJsonPageContent from '../../api/fieldset-legend.json';
import FieldsetRootApiJsonPageContent from '../../api/fieldset-root.json';

export default function Page(props) {
  const { userLanguage, ...other } = props;
  return <MarkdownDocs {...pageProps} {...other} />;
}

Page.getLayout = (page) => {
  return <AppFrame>{page}</AppFrame>;
};

export const getStaticPaths = () => {
  return {
    paths: [{ params: { docsTab: 'components-api' } }, { params: { docsTab: 'hooks-api' } }],
    fallback: false, // can also be true or 'blocking'
  };
};

export const getStaticProps = () => {
  const FieldsetLegendApiReq = require.context(
    'docs-base/translations/api-docs/fieldset-legend',
    false,
    /\.\/fieldset-legend.*.json$/,
  );
  const FieldsetLegendApiDescriptions = mapApiPageTranslations(FieldsetLegendApiReq);

  const FieldsetRootApiReq = require.context(
    'docs-base/translations/api-docs/fieldset-root',
    false,
    /\.\/fieldset-root.*.json$/,
  );
  const FieldsetRootApiDescriptions = mapApiPageTranslations(FieldsetRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        FieldsetLegend: FieldsetLegendApiDescriptions,
        FieldsetRoot: FieldsetRootApiDescriptions,
      },
      componentsApiPageContents: {
        FieldsetLegend: FieldsetLegendApiJsonPageContent,
        FieldsetRoot: FieldsetRootApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
