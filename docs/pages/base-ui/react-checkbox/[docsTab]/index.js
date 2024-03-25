import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs/data/base/components/checkbox/checkbox.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import CheckboxApiJsonPageContent from '../../api/checkbox.json';
import CheckboxIndicatorApiJsonPageContent from '../../api/checkbox-indicator.json';
import useCheckboxApiJsonPageContent from '../../api/use-checkbox.json';

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
  const CheckboxApiReq = require.context(
    'docs/translations/api-docs-base/checkbox',
    false,
    /checkbox.*.json$/,
  );
  const CheckboxApiDescriptions = mapApiPageTranslations(CheckboxApiReq);

  const CheckboxIndicatorApiReq = require.context(
    'docs/translations/api-docs-base/checkbox-indicator',
    false,
    /checkbox-indicator.*.json$/,
  );
  const CheckboxIndicatorApiDescriptions = mapApiPageTranslations(CheckboxIndicatorApiReq);

  const useCheckboxApiReq = require.context(
    'docs/translations/api-docs/use-checkbox',
    false,
    /use-checkbox.*.json$/,
  );
  const useCheckboxApiDescriptions = mapApiPageTranslations(useCheckboxApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        Checkbox: CheckboxApiDescriptions,
        CheckboxIndicator: CheckboxIndicatorApiDescriptions,
      },
      componentsApiPageContents: {
        Checkbox: CheckboxApiJsonPageContent,
        CheckboxIndicator: CheckboxIndicatorApiJsonPageContent,
      },
      hooksApiDescriptions: { useCheckbox: useCheckboxApiDescriptions },
      hooksApiPageContents: { useCheckbox: useCheckboxApiJsonPageContent },
    },
  };
};
