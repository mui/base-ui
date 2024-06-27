import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/hover-card/hover-card.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import HoverCardArrowApiJsonPageContent from '../../api/hover-card-arrow.json';
import HoverCardBackdropApiJsonPageContent from '../../api/hover-card-backdrop.json';
import HoverCardPopupApiJsonPageContent from '../../api/hover-card-popup.json';
import HoverCardPositionerApiJsonPageContent from '../../api/hover-card-positioner.json';
import HoverCardRootApiJsonPageContent from '../../api/hover-card-root.json';
import HoverCardTriggerApiJsonPageContent from '../../api/hover-card-trigger.json';

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
  const HoverCardArrowApiReq = require.context(
    'docs-base/translations/api-docs/hover-card-arrow',
    false,
    /\.\/hover-card-arrow.*.json$/,
  );
  const HoverCardArrowApiDescriptions = mapApiPageTranslations(HoverCardArrowApiReq);

  const HoverCardBackdropApiReq = require.context(
    'docs-base/translations/api-docs/hover-card-backdrop',
    false,
    /\.\/hover-card-backdrop.*.json$/,
  );
  const HoverCardBackdropApiDescriptions = mapApiPageTranslations(HoverCardBackdropApiReq);

  const HoverCardPopupApiReq = require.context(
    'docs-base/translations/api-docs/hover-card-popup',
    false,
    /\.\/hover-card-popup.*.json$/,
  );
  const HoverCardPopupApiDescriptions = mapApiPageTranslations(HoverCardPopupApiReq);

  const HoverCardPositionerApiReq = require.context(
    'docs-base/translations/api-docs/hover-card-positioner',
    false,
    /\.\/hover-card-positioner.*.json$/,
  );
  const HoverCardPositionerApiDescriptions = mapApiPageTranslations(HoverCardPositionerApiReq);

  const HoverCardRootApiReq = require.context(
    'docs-base/translations/api-docs/hover-card-root',
    false,
    /\.\/hover-card-root.*.json$/,
  );
  const HoverCardRootApiDescriptions = mapApiPageTranslations(HoverCardRootApiReq);

  const HoverCardTriggerApiReq = require.context(
    'docs-base/translations/api-docs/hover-card-trigger',
    false,
    /\.\/hover-card-trigger.*.json$/,
  );
  const HoverCardTriggerApiDescriptions = mapApiPageTranslations(HoverCardTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        HoverCardArrow: HoverCardArrowApiDescriptions,
        HoverCardBackdrop: HoverCardBackdropApiDescriptions,
        HoverCardPopup: HoverCardPopupApiDescriptions,
        HoverCardPositioner: HoverCardPositionerApiDescriptions,
        HoverCardRoot: HoverCardRootApiDescriptions,
        HoverCardTrigger: HoverCardTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        HoverCardArrow: HoverCardArrowApiJsonPageContent,
        HoverCardBackdrop: HoverCardBackdropApiJsonPageContent,
        HoverCardPopup: HoverCardPopupApiJsonPageContent,
        HoverCardPositioner: HoverCardPositionerApiJsonPageContent,
        HoverCardRoot: HoverCardRootApiJsonPageContent,
        HoverCardTrigger: HoverCardTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
