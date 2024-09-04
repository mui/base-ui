import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/collapsible/collapsible.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import CollapsibleContentApiJsonPageContent from '../../api/collapsible-content.json';
import CollapsibleRootApiJsonPageContent from '../../api/collapsible-root.json';
import CollapsibleTriggerApiJsonPageContent from '../../api/collapsible-trigger.json';
import useCollapsibleContentApiJsonPageContent from '../../api/use-collapsible-content.json';
import useCollapsibleRootApiJsonPageContent from '../../api/use-collapsible-root.json';
import useCollapsibleTriggerApiJsonPageContent from '../../api/use-collapsible-trigger.json';

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
  const CollapsibleContentApiReq = require.context(
    'docs-base/translations/api-docs/collapsible-content',
    false,
    /\.\/collapsible-content.*.json$/,
  );
  const CollapsibleContentApiDescriptions = mapApiPageTranslations(CollapsibleContentApiReq);

  const CollapsibleRootApiReq = require.context(
    'docs-base/translations/api-docs/collapsible-root',
    false,
    /\.\/collapsible-root.*.json$/,
  );
  const CollapsibleRootApiDescriptions = mapApiPageTranslations(CollapsibleRootApiReq);

  const CollapsibleTriggerApiReq = require.context(
    'docs-base/translations/api-docs/collapsible-trigger',
    false,
    /\.\/collapsible-trigger.*.json$/,
  );
  const CollapsibleTriggerApiDescriptions = mapApiPageTranslations(CollapsibleTriggerApiReq);

  const useCollapsibleContentApiReq = require.context(
    'docs-base/translations/api-docs/use-collapsible-content',
    false,
    /\.\/use-collapsible-content.*.json$/,
  );
  const useCollapsibleContentApiDescriptions = mapApiPageTranslations(useCollapsibleContentApiReq);

  const useCollapsibleRootApiReq = require.context(
    'docs-base/translations/api-docs/use-collapsible-root',
    false,
    /\.\/use-collapsible-root.*.json$/,
  );
  const useCollapsibleRootApiDescriptions = mapApiPageTranslations(useCollapsibleRootApiReq);

  const useCollapsibleTriggerApiReq = require.context(
    'docs-base/translations/api-docs/use-collapsible-trigger',
    false,
    /\.\/use-collapsible-trigger.*.json$/,
  );
  const useCollapsibleTriggerApiDescriptions = mapApiPageTranslations(useCollapsibleTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        CollapsibleContent: CollapsibleContentApiDescriptions,
        CollapsibleRoot: CollapsibleRootApiDescriptions,
        CollapsibleTrigger: CollapsibleTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        CollapsibleContent: CollapsibleContentApiJsonPageContent,
        CollapsibleRoot: CollapsibleRootApiJsonPageContent,
        CollapsibleTrigger: CollapsibleTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useCollapsibleContent: useCollapsibleContentApiDescriptions,
        useCollapsibleRoot: useCollapsibleRootApiDescriptions,
        useCollapsibleTrigger: useCollapsibleTriggerApiDescriptions,
      },
      hooksApiPageContents: {
        useCollapsibleContent: useCollapsibleContentApiJsonPageContent,
        useCollapsibleRoot: useCollapsibleRootApiJsonPageContent,
        useCollapsibleTrigger: useCollapsibleTriggerApiJsonPageContent,
      },
    },
  };
};
