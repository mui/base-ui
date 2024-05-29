import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/switch/switch.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import SwitchRootApiJsonPageContent from '../../api/switch-root.json';
import SwitchThumbApiJsonPageContent from '../../api/switch-thumb.json';
import useSwitchRootApiJsonPageContent from '../../api/use-switch-root.json';

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
  const SwitchRootApiReq = require.context(
    'docs-base/translations/api-docs/switch-root',
    false,
    /\.\/switch-root.*.json$/,
  );
  const SwitchRootApiDescriptions = mapApiPageTranslations(SwitchRootApiReq);

  const SwitchThumbApiReq = require.context(
    'docs-base/translations/api-docs/switch-thumb',
    false,
    /\.\/switch-thumb.*.json$/,
  );
  const SwitchThumbApiDescriptions = mapApiPageTranslations(SwitchThumbApiReq);

  const useSwitchRootApiReq = require.context(
    'docs-base/translations/api-docs/use-switch-root',
    false,
    /\.\/use-switch-root.*.json$/,
  );
  const useSwitchRootApiDescriptions = mapApiPageTranslations(useSwitchRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        SwitchRoot: SwitchRootApiDescriptions,
        SwitchThumb: SwitchThumbApiDescriptions,
      },
      componentsApiPageContents: {
        SwitchRoot: SwitchRootApiJsonPageContent,
        SwitchThumb: SwitchThumbApiJsonPageContent,
      },
      hooksApiDescriptions: { useSwitchRoot: useSwitchRootApiDescriptions },
      hooksApiPageContents: { useSwitchRoot: useSwitchRootApiJsonPageContent },
    },
  };
};
