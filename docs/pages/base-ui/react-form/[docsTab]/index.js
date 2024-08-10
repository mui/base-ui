import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/form/form.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import FormRootApiJsonPageContent from '../../api/form-root.json';
import FormSubmitApiJsonPageContent from '../../api/form-submit.json';

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
  const FormRootApiReq = require.context(
    'docs-base/translations/api-docs/form-root',
    false,
    /\.\/form-root.*.json$/,
  );
  const FormRootApiDescriptions = mapApiPageTranslations(FormRootApiReq);

  const FormSubmitApiReq = require.context(
    'docs-base/translations/api-docs/form-submit',
    false,
    /\.\/form-submit.*.json$/,
  );
  const FormSubmitApiDescriptions = mapApiPageTranslations(FormSubmitApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        FormRoot: FormRootApiDescriptions,
        FormSubmit: FormSubmitApiDescriptions,
      },
      componentsApiPageContents: {
        FormRoot: FormRootApiJsonPageContent,
        FormSubmit: FormSubmitApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
