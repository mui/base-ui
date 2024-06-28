import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/preview-card/preview-card.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import PreviewCardArrowApiJsonPageContent from '../../api/preview-card-arrow.json';
import PreviewCardBackdropApiJsonPageContent from '../../api/preview-card-backdrop.json';
import PreviewCardPopupApiJsonPageContent from '../../api/preview-card-popup.json';
import PreviewCardPositionerApiJsonPageContent from '../../api/preview-card-positioner.json';
import PreviewCardRootApiJsonPageContent from '../../api/preview-card-root.json';
import PreviewCardTriggerApiJsonPageContent from '../../api/preview-card-trigger.json';

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
  const PreviewCardArrowApiReq = require.context(
    'docs-base/translations/api-docs/preview-card-arrow',
    false,
    /\.\/preview-card-arrow.*.json$/,
  );
  const PreviewCardArrowApiDescriptions = mapApiPageTranslations(PreviewCardArrowApiReq);

  const PreviewCardBackdropApiReq = require.context(
    'docs-base/translations/api-docs/preview-card-backdrop',
    false,
    /\.\/preview-card-backdrop.*.json$/,
  );
  const PreviewCardBackdropApiDescriptions = mapApiPageTranslations(PreviewCardBackdropApiReq);

  const PreviewCardPopupApiReq = require.context(
    'docs-base/translations/api-docs/preview-card-popup',
    false,
    /\.\/preview-card-popup.*.json$/,
  );
  const PreviewCardPopupApiDescriptions = mapApiPageTranslations(PreviewCardPopupApiReq);

  const PreviewCardPositionerApiReq = require.context(
    'docs-base/translations/api-docs/preview-card-positioner',
    false,
    /\.\/preview-card-positioner.*.json$/,
  );
  const PreviewCardPositionerApiDescriptions = mapApiPageTranslations(PreviewCardPositionerApiReq);

  const PreviewCardRootApiReq = require.context(
    'docs-base/translations/api-docs/preview-card-root',
    false,
    /\.\/preview-card-root.*.json$/,
  );
  const PreviewCardRootApiDescriptions = mapApiPageTranslations(PreviewCardRootApiReq);

  const PreviewCardTriggerApiReq = require.context(
    'docs-base/translations/api-docs/preview-card-trigger',
    false,
    /\.\/preview-card-trigger.*.json$/,
  );
  const PreviewCardTriggerApiDescriptions = mapApiPageTranslations(PreviewCardTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        PreviewCardArrow: PreviewCardArrowApiDescriptions,
        PreviewCardBackdrop: PreviewCardBackdropApiDescriptions,
        PreviewCardPopup: PreviewCardPopupApiDescriptions,
        PreviewCardPositioner: PreviewCardPositionerApiDescriptions,
        PreviewCardRoot: PreviewCardRootApiDescriptions,
        PreviewCardTrigger: PreviewCardTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        PreviewCardArrow: PreviewCardArrowApiJsonPageContent,
        PreviewCardBackdrop: PreviewCardBackdropApiJsonPageContent,
        PreviewCardPopup: PreviewCardPopupApiJsonPageContent,
        PreviewCardPositioner: PreviewCardPositionerApiJsonPageContent,
        PreviewCardRoot: PreviewCardRootApiJsonPageContent,
        PreviewCardTrigger: PreviewCardTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
