import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/tooltip/tooltip.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import TooltipArrowApiJsonPageContent from '../../api/tooltip-arrow.json';
import TooltipGroupApiJsonPageContent from '../../api/tooltip-group.json';
import TooltipPopupApiJsonPageContent from '../../api/tooltip-popup.json';
import TooltipRootApiJsonPageContent from '../../api/tooltip-root.json';
import TooltipTriggerApiJsonPageContent from '../../api/tooltip-trigger.json';
import useTooltipPopupApiJsonPageContent from '../../api/use-tooltip-popup.json';
import useTooltipRootApiJsonPageContent from '../../api/use-tooltip-root.json';

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
  const TooltipArrowApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-arrow',
    false,
    /\.\/tooltip-arrow.*.json$/,
  );
  const TooltipArrowApiDescriptions = mapApiPageTranslations(TooltipArrowApiReq);

  const TooltipGroupApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-group',
    false,
    /\.\/tooltip-group.*.json$/,
  );
  const TooltipGroupApiDescriptions = mapApiPageTranslations(TooltipGroupApiReq);

  const TooltipPopupApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-popup',
    false,
    /\.\/tooltip-popup.*.json$/,
  );
  const TooltipPopupApiDescriptions = mapApiPageTranslations(TooltipPopupApiReq);

  const TooltipRootApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-root',
    false,
    /\.\/tooltip-root.*.json$/,
  );
  const TooltipRootApiDescriptions = mapApiPageTranslations(TooltipRootApiReq);

  const TooltipTriggerApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-trigger',
    false,
    /\.\/tooltip-trigger.*.json$/,
  );
  const TooltipTriggerApiDescriptions = mapApiPageTranslations(TooltipTriggerApiReq);

  const useTooltipPopupApiReq = require.context(
    'docs-base/translations/api-docs/use-tooltip-popup',
    false,
    /\.\/use-tooltip-popup.*.json$/,
  );
  const useTooltipPopupApiDescriptions = mapApiPageTranslations(useTooltipPopupApiReq);

  const useTooltipRootApiReq = require.context(
    'docs-base/translations/api-docs/use-tooltip-root',
    false,
    /\.\/use-tooltip-root.*.json$/,
  );
  const useTooltipRootApiDescriptions = mapApiPageTranslations(useTooltipRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        TooltipArrow: TooltipArrowApiDescriptions,
        TooltipGroup: TooltipGroupApiDescriptions,
        TooltipPopup: TooltipPopupApiDescriptions,
        TooltipRoot: TooltipRootApiDescriptions,
        TooltipTrigger: TooltipTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        TooltipArrow: TooltipArrowApiJsonPageContent,
        TooltipGroup: TooltipGroupApiJsonPageContent,
        TooltipPopup: TooltipPopupApiJsonPageContent,
        TooltipRoot: TooltipRootApiJsonPageContent,
        TooltipTrigger: TooltipTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useTooltipPopup: useTooltipPopupApiDescriptions,
        useTooltipRoot: useTooltipRootApiDescriptions,
      },
      hooksApiPageContents: {
        useTooltipPopup: useTooltipPopupApiJsonPageContent,
        useTooltipRoot: useTooltipRootApiJsonPageContent,
      },
    },
  };
};
