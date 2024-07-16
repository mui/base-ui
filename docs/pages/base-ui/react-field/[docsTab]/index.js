import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/field/field.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import FieldControlApiJsonPageContent from '../../api/field-control.json';
import FieldMessageApiJsonPageContent from '../../api/field-description.json';
import FieldLabelApiJsonPageContent from '../../api/field-label.json';
import FieldRootApiJsonPageContent from '../../api/field-root.json';

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

  const FieldMessageApiReq = require.context(
    'docs-base/translations/api-docs/field-description',
    false,
    /\.\/field-description.*.json$/,
  );
  const FieldMessageApiDescriptions = mapApiPageTranslations(FieldMessageApiReq);

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

  return {
    props: {
      componentsApiDescriptions: {
        FieldControl: FieldControlApiDescriptions,
        FieldMessage: FieldMessageApiDescriptions,
        FieldLabel: FieldLabelApiDescriptions,
        FieldRoot: FieldRootApiDescriptions,
      },
      componentsApiPageContents: {
        FieldControl: FieldControlApiJsonPageContent,
        FieldMessage: FieldMessageApiJsonPageContent,
        FieldLabel: FieldLabelApiJsonPageContent,
        FieldRoot: FieldRootApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
