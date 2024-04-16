import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs/data/base/components/switch/switch.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import SwitchRootApiJsonPageContent from '../../api/switch-root.json';
import SwitchThumbApiJsonPageContent from '../../api/switch-thumb.json';
import useSwitchApiJsonPageContent from '../../api/use-switch.json';

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
    'docs/translations/api-docs-base/switch-root',
    false,
    /switch-root.*.json$/,
  );
  const SwitchRootApiDescriptions = mapApiPageTranslations(SwitchRootApiReq);

  const SwitchThumbApiReq = require.context(
    'docs/translations/api-docs-base/switch-thumb',
    false,
    /switch-thumb.*.json$/,
  );
  const SwitchThumbApiDescriptions = mapApiPageTranslations(SwitchThumbApiReq);

  const useSwitchApiReq = require.context(
    'docs/translations/api-docs/use-switch',
    false,
    /use-switch.*.json$/,
  );
  const useSwitchApiDescriptions = mapApiPageTranslations(useSwitchApiReq);

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
      hooksApiDescriptions: { useSwitch: useSwitchApiDescriptions },
      hooksApiPageContents: { useSwitch: useSwitchApiJsonPageContent },
    },
  };
};
