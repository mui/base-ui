import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/checkbox-group/checkbox-group.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import CheckboxGroupRootApiJsonPageContent from '../../api/checkbox-group-root.json';

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
  const CheckboxGroupRootApiReq = require.context(
    'docs-base/translations/api-docs/checkbox-group-root',
    false,
    /\.\/checkbox-group-root.*.json$/,
  );
  const CheckboxGroupRootApiDescriptions = mapApiPageTranslations(CheckboxGroupRootApiReq);

  return {
    props: {
      componentsApiDescriptions: { CheckboxGroupRoot: CheckboxGroupRootApiDescriptions },
      componentsApiPageContents: { CheckboxGroupRoot: CheckboxGroupRootApiJsonPageContent },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
