import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/portal/portal.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import PortalApiJsonPageContent from '../../api/portal.json';

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
  const PortalApiReq = require.context(
    'docs-base/translations/api-docs/portal',
    false,
    /\.\/portal.*.json$/,
  );
  const PortalApiDescriptions = mapApiPageTranslations(PortalApiReq);

  return {
    props: {
      componentsApiDescriptions: { Portal: PortalApiDescriptions },
      componentsApiPageContents: { Portal: PortalApiJsonPageContent },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
