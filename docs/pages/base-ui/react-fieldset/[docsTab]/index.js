import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/fieldset/fieldset.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import FieldsetLabelApiJsonPageContent from '../../api/fieldset-label.json';
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
  const FieldsetLabelApiReq = require.context(
    'docs-base/translations/api-docs/fieldset-label',
    false,
    /\.\/fieldset-label.*.json$/,
  );
  const FieldsetLabelApiDescriptions = mapApiPageTranslations(FieldsetLabelApiReq);

  const FieldsetRootApiReq = require.context(
    'docs-base/translations/api-docs/fieldset-root',
    false,
    /\.\/fieldset-root.*.json$/,
  );
  const FieldsetRootApiDescriptions = mapApiPageTranslations(FieldsetRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        FieldsetLabel: FieldsetLabelApiDescriptions,
        FieldsetRoot: FieldsetRootApiDescriptions,
      },
      componentsApiPageContents: {
        FieldsetLabel: FieldsetLabelApiJsonPageContent,
        FieldsetRoot: FieldsetRootApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
