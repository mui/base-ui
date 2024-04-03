import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/tooltip/tooltip.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import TooltipArrowApiJsonPageContent from '../../api/tooltip-arrow.json';
import TooltipContentApiJsonPageContent from '../../api/tooltip-content.json';
import TooltipGroupApiJsonPageContent from '../../api/tooltip-group.json';
import TooltipRootApiJsonPageContent from '../../api/tooltip-root.json';
import TooltipTriggerApiJsonPageContent from '../../api/tooltip-trigger.json';
import useTooltipApiJsonPageContent from '../../api/use-tooltip.json';
import useTooltipOpenStateApiJsonPageContent from '../../api/use-tooltip-open-state.json';

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

  const TooltipContentApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-content',
    false,
    /\.\/tooltip-content.*.json$/,
  );
  const TooltipContentApiDescriptions = mapApiPageTranslations(TooltipContentApiReq);

  const TooltipGroupApiReq = require.context(
    'docs-base/translations/api-docs/tooltip-group',
    false,
    /\.\/tooltip-group.*.json$/,
  );
  const TooltipGroupApiDescriptions = mapApiPageTranslations(TooltipGroupApiReq);

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

  const useTooltipApiReq = require.context(
    'docs-base/translations/api-docs/use-tooltip',
    false,
    /\.\/use-tooltip.*.json$/,
  );
  const useTooltipApiDescriptions = mapApiPageTranslations(useTooltipApiReq);

  const useTooltipOpenStateApiReq = require.context(
    'docs-base/translations/api-docs/use-tooltip-open-state',
    false,
    /\.\/use-tooltip-open-state.*.json$/,
  );
  const useTooltipOpenStateApiDescriptions = mapApiPageTranslations(useTooltipOpenStateApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        TooltipArrow: TooltipArrowApiDescriptions,
        TooltipContent: TooltipContentApiDescriptions,
        TooltipGroup: TooltipGroupApiDescriptions,
        TooltipRoot: TooltipRootApiDescriptions,
        TooltipTrigger: TooltipTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        TooltipArrow: TooltipArrowApiJsonPageContent,
        TooltipContent: TooltipContentApiJsonPageContent,
        TooltipGroup: TooltipGroupApiJsonPageContent,
        TooltipRoot: TooltipRootApiJsonPageContent,
        TooltipTrigger: TooltipTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useTooltip: useTooltipApiDescriptions,
        useTooltipOpenState: useTooltipOpenStateApiDescriptions,
      },
      hooksApiPageContents: {
        useTooltip: useTooltipApiJsonPageContent,
        useTooltipOpenState: useTooltipOpenStateApiJsonPageContent,
      },
    },
  };
};
