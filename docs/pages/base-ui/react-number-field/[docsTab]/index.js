import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs/data/base/components/number-field/number-field.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import NumberFieldDecrementApiJsonPageContent from '../../api/number-field-decrement.json';
import NumberFieldGroupApiJsonPageContent from '../../api/number-field-group.json';
import NumberFieldIncrementApiJsonPageContent from '../../api/number-field-increment.json';
import NumberFieldInputApiJsonPageContent from '../../api/number-field-input.json';
import NumberFieldRootApiJsonPageContent from '../../api/number-field-root.json';
import NumberFieldScrubAreaApiJsonPageContent from '../../api/number-field-scrub-area.json';
import NumberFieldScrubAreaCursorApiJsonPageContent from '../../api/number-field-scrub-area-cursor.json';
import useNumberFieldApiJsonPageContent from '../../api/use-number-field.json';

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
  const NumberFieldDecrementApiReq = require.context(
    'docs/translations/api-docs-base/number-field-decrement',
    false,
    /number-field-decrement.*.json$/,
  );
  const NumberFieldDecrementApiDescriptions = mapApiPageTranslations(NumberFieldDecrementApiReq);

  const NumberFieldGroupApiReq = require.context(
    'docs/translations/api-docs-base/number-field-group',
    false,
    /number-field-group.*.json$/,
  );
  const NumberFieldGroupApiDescriptions = mapApiPageTranslations(NumberFieldGroupApiReq);

  const NumberFieldIncrementApiReq = require.context(
    'docs/translations/api-docs-base/number-field-increment',
    false,
    /number-field-increment.*.json$/,
  );
  const NumberFieldIncrementApiDescriptions = mapApiPageTranslations(NumberFieldIncrementApiReq);

  const NumberFieldInputApiReq = require.context(
    'docs/translations/api-docs-base/number-field-input',
    false,
    /number-field-input.*.json$/,
  );
  const NumberFieldInputApiDescriptions = mapApiPageTranslations(NumberFieldInputApiReq);

  const NumberFieldRootApiReq = require.context(
    'docs/translations/api-docs-base/number-field-root',
    false,
    /number-field-root.*.json$/,
  );
  const NumberFieldRootApiDescriptions = mapApiPageTranslations(NumberFieldRootApiReq);

  const NumberFieldScrubAreaApiReq = require.context(
    'docs/translations/api-docs-base/number-field-scrub-area',
    false,
    /number-field-scrub-area.*.json$/,
  );
  const NumberFieldScrubAreaApiDescriptions = mapApiPageTranslations(NumberFieldScrubAreaApiReq);

  const NumberFieldScrubAreaCursorApiReq = require.context(
    'docs/translations/api-docs-base/number-field-scrub-area-cursor',
    false,
    /number-field-scrub-area-cursor.*.json$/,
  );
  const NumberFieldScrubAreaCursorApiDescriptions = mapApiPageTranslations(
    NumberFieldScrubAreaCursorApiReq,
  );

  const useNumberFieldApiReq = require.context(
    'docs/translations/api-docs/use-number-field',
    false,
    /use-number-field.*.json$/,
  );
  const useNumberFieldApiDescriptions = mapApiPageTranslations(useNumberFieldApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        NumberFieldDecrement: NumberFieldDecrementApiDescriptions,
        NumberFieldGroup: NumberFieldGroupApiDescriptions,
        NumberFieldIncrement: NumberFieldIncrementApiDescriptions,
        NumberFieldInput: NumberFieldInputApiDescriptions,
        NumberFieldRoot: NumberFieldRootApiDescriptions,
        NumberFieldScrubArea: NumberFieldScrubAreaApiDescriptions,
        NumberFieldScrubAreaCursor: NumberFieldScrubAreaCursorApiDescriptions,
      },
      componentsApiPageContents: {
        NumberFieldDecrement: NumberFieldDecrementApiJsonPageContent,
        NumberFieldGroup: NumberFieldGroupApiJsonPageContent,
        NumberFieldIncrement: NumberFieldIncrementApiJsonPageContent,
        NumberFieldInput: NumberFieldInputApiJsonPageContent,
        NumberFieldRoot: NumberFieldRootApiJsonPageContent,
        NumberFieldScrubArea: NumberFieldScrubAreaApiJsonPageContent,
        NumberFieldScrubAreaCursor: NumberFieldScrubAreaCursorApiJsonPageContent,
      },
      hooksApiDescriptions: { useNumberField: useNumberFieldApiDescriptions },
      hooksApiPageContents: { useNumberField: useNumberFieldApiJsonPageContent },
    },
  };
};
