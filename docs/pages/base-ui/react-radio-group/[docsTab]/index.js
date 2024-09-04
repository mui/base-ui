import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/radio-group/radio-group.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import RadioGroupRootApiJsonPageContent from '../../api/radio-group-root.json';
import RadioIndicatorApiJsonPageContent from '../../api/radio-indicator.json';
import RadioRootApiJsonPageContent from '../../api/radio-root.json';

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
  const RadioGroupRootApiReq = require.context(
    'docs-base/translations/api-docs/radio-group-root',
    false,
    /\.\/radio-group-root.*.json$/,
  );
  const RadioGroupRootApiDescriptions = mapApiPageTranslations(RadioGroupRootApiReq);

  const RadioIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/radio-indicator',
    false,
    /\.\/radio-indicator.*.json$/,
  );
  const RadioIndicatorApiDescriptions = mapApiPageTranslations(RadioIndicatorApiReq);

  const RadioRootApiReq = require.context(
    'docs-base/translations/api-docs/radio-root',
    false,
    /\.\/radio-root.*.json$/,
  );
  const RadioRootApiDescriptions = mapApiPageTranslations(RadioRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        RadioGroupRoot: RadioGroupRootApiDescriptions,
        RadioIndicator: RadioIndicatorApiDescriptions,
        RadioRoot: RadioRootApiDescriptions,
      },
      componentsApiPageContents: {
        RadioGroupRoot: RadioGroupRootApiJsonPageContent,
        RadioIndicator: RadioIndicatorApiJsonPageContent,
        RadioRoot: RadioRootApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
