import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/field/field.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import FieldControlApiJsonPageContent from '../../api/field-control.json';
import FieldDescriptionApiJsonPageContent from '../../api/field-description.json';
import FieldErrorApiJsonPageContent from '../../api/field-error.json';
import FieldLabelApiJsonPageContent from '../../api/field-label.json';
import FieldRootApiJsonPageContent from '../../api/field-root.json';
import FieldValidityApiJsonPageContent from '../../api/field-validity.json';

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
  const FieldControlApiReq = require.context(
    'docs-base/translations/api-docs/field-control',
    false,
    /\.\/field-control.*.json$/,
  );
  const FieldControlApiDescriptions = mapApiPageTranslations(FieldControlApiReq);

  const FieldDescriptionApiReq = require.context(
    'docs-base/translations/api-docs/field-description',
    false,
    /\.\/field-description.*.json$/,
  );
  const FieldDescriptionApiDescriptions = mapApiPageTranslations(FieldDescriptionApiReq);

  const FieldErrorApiReq = require.context(
    'docs-base/translations/api-docs/field-error',
    false,
    /\.\/field-error.*.json$/,
  );
  const FieldErrorApiDescriptions = mapApiPageTranslations(FieldErrorApiReq);

  const FieldLabelApiReq = require.context(
    'docs-base/translations/api-docs/field-label',
    false,
    /\.\/field-label.*.json$/,
  );
  const FieldLabelApiDescriptions = mapApiPageTranslations(FieldLabelApiReq);

  const FieldRootApiReq = require.context(
    'docs-base/translations/api-docs/field-root',
    false,
    /\.\/field-root.*.json$/,
  );
  const FieldRootApiDescriptions = mapApiPageTranslations(FieldRootApiReq);

  const FieldValidityApiReq = require.context(
    'docs-base/translations/api-docs/field-validity',
    false,
    /\.\/field-validity.*.json$/,
  );
  const FieldValidityApiDescriptions = mapApiPageTranslations(FieldValidityApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        FieldControl: FieldControlApiDescriptions,
        FieldDescription: FieldDescriptionApiDescriptions,
        FieldError: FieldErrorApiDescriptions,
        FieldLabel: FieldLabelApiDescriptions,
        FieldRoot: FieldRootApiDescriptions,
        FieldValidity: FieldValidityApiDescriptions,
      },
      componentsApiPageContents: {
        FieldControl: FieldControlApiJsonPageContent,
        FieldDescription: FieldDescriptionApiJsonPageContent,
        FieldError: FieldErrorApiJsonPageContent,
        FieldLabel: FieldLabelApiJsonPageContent,
        FieldRoot: FieldRootApiJsonPageContent,
        FieldValidity: FieldValidityApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
