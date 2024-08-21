import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/progress/progress.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import ProgressIndicatorApiJsonPageContent from '../../api/progress-indicator.json';
import ProgressRootApiJsonPageContent from '../../api/progress-root.json';
import ProgressTrackApiJsonPageContent from '../../api/progress-track.json';
import useProgressIndicatorApiJsonPageContent from '../../api/use-progress-indicator.json';
import useProgressRootApiJsonPageContent from '../../api/use-progress-root.json';

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
  const ProgressIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/progress-indicator',
    false,
    /\.\/progress-indicator.*.json$/,
  );
  const ProgressIndicatorApiDescriptions = mapApiPageTranslations(ProgressIndicatorApiReq);

  const ProgressRootApiReq = require.context(
    'docs-base/translations/api-docs/progress-root',
    false,
    /\.\/progress-root.*.json$/,
  );
  const ProgressRootApiDescriptions = mapApiPageTranslations(ProgressRootApiReq);

  const ProgressTrackApiReq = require.context(
    'docs-base/translations/api-docs/progress-track',
    false,
    /\.\/progress-track.*.json$/,
  );
  const ProgressTrackApiDescriptions = mapApiPageTranslations(ProgressTrackApiReq);

  const useProgressIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/use-progress-indicator',
    false,
    /\.\/use-progress-indicator.*.json$/,
  );
  const useProgressIndicatorApiDescriptions = mapApiPageTranslations(useProgressIndicatorApiReq);

  const useProgressRootApiReq = require.context(
    'docs-base/translations/api-docs/use-progress-root',
    false,
    /\.\/use-progress-root.*.json$/,
  );
  const useProgressRootApiDescriptions = mapApiPageTranslations(useProgressRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        ProgressIndicator: ProgressIndicatorApiDescriptions,
        ProgressRoot: ProgressRootApiDescriptions,
        ProgressTrack: ProgressTrackApiDescriptions,
      },
      componentsApiPageContents: {
        ProgressIndicator: ProgressIndicatorApiJsonPageContent,
        ProgressRoot: ProgressRootApiJsonPageContent,
        ProgressTrack: ProgressTrackApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useProgressIndicator: useProgressIndicatorApiDescriptions,
        useProgressRoot: useProgressRootApiDescriptions,
      },
      hooksApiPageContents: {
        useProgressIndicator: useProgressIndicatorApiJsonPageContent,
        useProgressRoot: useProgressRootApiJsonPageContent,
      },
    },
  };
};
