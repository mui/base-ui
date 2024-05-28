import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/checkbox/checkbox.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import CheckboxIndicatorApiJsonPageContent from '../../api/checkbox-indicator.json';
import CheckboxRootApiJsonPageContent from '../../api/checkbox-root.json';
import useCheckboxRootApiJsonPageContent from '../../api/use-checkbox-root.json';

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
  const CheckboxIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/checkbox-indicator',
    false,
    /\.\/checkbox-indicator.*.json$/,
  );
  const CheckboxIndicatorApiDescriptions = mapApiPageTranslations(CheckboxIndicatorApiReq);

  const CheckboxRootApiReq = require.context(
    'docs-base/translations/api-docs/checkbox-root',
    false,
    /\.\/checkbox-root.*.json$/,
  );
  const CheckboxRootApiDescriptions = mapApiPageTranslations(CheckboxRootApiReq);

  const useCheckboxRootApiReq = require.context(
    'docs-base/translations/api-docs/use-checkbox-root',
    false,
    /\.\/use-checkbox-root.*.json$/,
  );
  const useCheckboxRootApiDescriptions = mapApiPageTranslations(useCheckboxRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        CheckboxIndicator: CheckboxIndicatorApiDescriptions,
        CheckboxRoot: CheckboxRootApiDescriptions,
      },
      componentsApiPageContents: {
        CheckboxIndicator: CheckboxIndicatorApiJsonPageContent,
        CheckboxRoot: CheckboxRootApiJsonPageContent,
      },
      hooksApiDescriptions: { useCheckboxRoot: useCheckboxRootApiDescriptions },
      hooksApiPageContents: { useCheckboxRoot: useCheckboxRootApiJsonPageContent },
    },
  };
};
