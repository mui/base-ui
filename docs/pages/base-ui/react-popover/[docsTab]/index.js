import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/popover/popover.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import PopoverArrowApiJsonPageContent from '../../api/popover-arrow.json';
import PopoverBackdropApiJsonPageContent from '../../api/popover-backdrop.json';
import PopoverCloseApiJsonPageContent from '../../api/popover-close.json';
import PopoverDescriptionApiJsonPageContent from '../../api/popover-description.json';
import PopoverPopupApiJsonPageContent from '../../api/popover-popup.json';
import PopoverPositionerApiJsonPageContent from '../../api/popover-positioner.json';
import PopoverRootApiJsonPageContent from '../../api/popover-root.json';
import PopoverTitleApiJsonPageContent from '../../api/popover-title.json';
import PopoverTriggerApiJsonPageContent from '../../api/popover-trigger.json';

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
  const PopoverArrowApiReq = require.context(
    'docs-base/translations/api-docs/popover-arrow',
    false,
    /\.\/popover-arrow.*.json$/,
  );
  const PopoverArrowApiDescriptions = mapApiPageTranslations(PopoverArrowApiReq);

  const PopoverBackdropApiReq = require.context(
    'docs-base/translations/api-docs/popover-backdrop',
    false,
    /\.\/popover-backdrop.*.json$/,
  );
  const PopoverBackdropApiDescriptions = mapApiPageTranslations(PopoverBackdropApiReq);

  const PopoverCloseApiReq = require.context(
    'docs-base/translations/api-docs/popover-close',
    false,
    /\.\/popover-close.*.json$/,
  );
  const PopoverCloseApiDescriptions = mapApiPageTranslations(PopoverCloseApiReq);

  const PopoverDescriptionApiReq = require.context(
    'docs-base/translations/api-docs/popover-description',
    false,
    /\.\/popover-description.*.json$/,
  );
  const PopoverDescriptionApiDescriptions = mapApiPageTranslations(PopoverDescriptionApiReq);

  const PopoverPopupApiReq = require.context(
    'docs-base/translations/api-docs/popover-popup',
    false,
    /\.\/popover-popup.*.json$/,
  );
  const PopoverPopupApiDescriptions = mapApiPageTranslations(PopoverPopupApiReq);

  const PopoverPositionerApiReq = require.context(
    'docs-base/translations/api-docs/popover-positioner',
    false,
    /\.\/popover-positioner.*.json$/,
  );
  const PopoverPositionerApiDescriptions = mapApiPageTranslations(PopoverPositionerApiReq);

  const PopoverRootApiReq = require.context(
    'docs-base/translations/api-docs/popover-root',
    false,
    /\.\/popover-root.*.json$/,
  );
  const PopoverRootApiDescriptions = mapApiPageTranslations(PopoverRootApiReq);

  const PopoverTitleApiReq = require.context(
    'docs-base/translations/api-docs/popover-title',
    false,
    /\.\/popover-title.*.json$/,
  );
  const PopoverTitleApiDescriptions = mapApiPageTranslations(PopoverTitleApiReq);

  const PopoverTriggerApiReq = require.context(
    'docs-base/translations/api-docs/popover-trigger',
    false,
    /\.\/popover-trigger.*.json$/,
  );
  const PopoverTriggerApiDescriptions = mapApiPageTranslations(PopoverTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        PopoverArrow: PopoverArrowApiDescriptions,
        PopoverBackdrop: PopoverBackdropApiDescriptions,
        PopoverClose: PopoverCloseApiDescriptions,
        PopoverDescription: PopoverDescriptionApiDescriptions,
        PopoverPopup: PopoverPopupApiDescriptions,
        PopoverPositioner: PopoverPositionerApiDescriptions,
        PopoverRoot: PopoverRootApiDescriptions,
        PopoverTitle: PopoverTitleApiDescriptions,
        PopoverTrigger: PopoverTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        PopoverArrow: PopoverArrowApiJsonPageContent,
        PopoverBackdrop: PopoverBackdropApiJsonPageContent,
        PopoverClose: PopoverCloseApiJsonPageContent,
        PopoverDescription: PopoverDescriptionApiJsonPageContent,
        PopoverPopup: PopoverPopupApiJsonPageContent,
        PopoverPositioner: PopoverPositionerApiJsonPageContent,
        PopoverRoot: PopoverRootApiJsonPageContent,
        PopoverTitle: PopoverTitleApiJsonPageContent,
        PopoverTrigger: PopoverTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
