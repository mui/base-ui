import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/radio-group/radio-group.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import RadioGroupIndicatorApiJsonPageContent from '../../api/radio-group-indicator.json';
import RadioGroupItemApiJsonPageContent from '../../api/radio-group-item.json';
import RadioGroupRootApiJsonPageContent from '../../api/radio-group-root.json';

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
  const RadioGroupIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/radio-group-indicator',
    false,
    /\.\/radio-group-indicator.*.json$/,
  );
  const RadioGroupIndicatorApiDescriptions = mapApiPageTranslations(RadioGroupIndicatorApiReq);

  const RadioGroupItemApiReq = require.context(
    'docs-base/translations/api-docs/radio-group-item',
    false,
    /\.\/radio-group-item.*.json$/,
  );
  const RadioGroupItemApiDescriptions = mapApiPageTranslations(RadioGroupItemApiReq);

  const RadioGroupRootApiReq = require.context(
    'docs-base/translations/api-docs/radio-group-root',
    false,
    /\.\/radio-group-root.*.json$/,
  );
  const RadioGroupRootApiDescriptions = mapApiPageTranslations(RadioGroupRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        RadioGroupIndicator: RadioGroupIndicatorApiDescriptions,
        RadioGroupItem: RadioGroupItemApiDescriptions,
        RadioGroupRoot: RadioGroupRootApiDescriptions,
      },
      componentsApiPageContents: {
        RadioGroupIndicator: RadioGroupIndicatorApiJsonPageContent,
        RadioGroupItem: RadioGroupItemApiJsonPageContent,
        RadioGroupRoot: RadioGroupRootApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
