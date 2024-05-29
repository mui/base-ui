import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/tabs/tabs.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import TabApiJsonPageContent from '../../api/tab.json';
import TabIndicatorApiJsonPageContent from '../../api/tab-indicator.json';
import TabPanelApiJsonPageContent from '../../api/tab-panel.json';
import TabsListApiJsonPageContent from '../../api/tabs-list.json';
import TabsRootApiJsonPageContent from '../../api/tabs-root.json';
import useTabApiJsonPageContent from '../../api/use-tab.json';
import useTabIndicatorApiJsonPageContent from '../../api/use-tab-indicator.json';
import useTabPanelApiJsonPageContent from '../../api/use-tab-panel.json';
import useTabsListApiJsonPageContent from '../../api/use-tabs-list.json';
import useTabsRootApiJsonPageContent from '../../api/use-tabs-root.json';

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
  const TabApiReq = require.context(
    'docs-base/translations/api-docs/tab',
    false,
    /\.\/tab.*.json$/,
  );
  const TabApiDescriptions = mapApiPageTranslations(TabApiReq);

  const TabIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/tab-indicator',
    false,
    /\.\/tab-indicator.*.json$/,
  );
  const TabIndicatorApiDescriptions = mapApiPageTranslations(TabIndicatorApiReq);

  const TabPanelApiReq = require.context(
    'docs-base/translations/api-docs/tab-panel',
    false,
    /\.\/tab-panel.*.json$/,
  );
  const TabPanelApiDescriptions = mapApiPageTranslations(TabPanelApiReq);

  const TabsListApiReq = require.context(
    'docs-base/translations/api-docs/tabs-list',
    false,
    /\.\/tabs-list.*.json$/,
  );
  const TabsListApiDescriptions = mapApiPageTranslations(TabsListApiReq);

  const TabsRootApiReq = require.context(
    'docs-base/translations/api-docs/tabs-root',
    false,
    /\.\/tabs-root.*.json$/,
  );
  const TabsRootApiDescriptions = mapApiPageTranslations(TabsRootApiReq);

  const useTabApiReq = require.context(
    'docs-base/translations/api-docs/use-tab',
    false,
    /\.\/use-tab.*.json$/,
  );
  const useTabApiDescriptions = mapApiPageTranslations(useTabApiReq);

  const useTabIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/use-tab-indicator',
    false,
    /\.\/use-tab-indicator.*.json$/,
  );
  const useTabIndicatorApiDescriptions = mapApiPageTranslations(useTabIndicatorApiReq);

  const useTabPanelApiReq = require.context(
    'docs-base/translations/api-docs/use-tab-panel',
    false,
    /\.\/use-tab-panel.*.json$/,
  );
  const useTabPanelApiDescriptions = mapApiPageTranslations(useTabPanelApiReq);

  const useTabsListApiReq = require.context(
    'docs-base/translations/api-docs/use-tabs-list',
    false,
    /\.\/use-tabs-list.*.json$/,
  );
  const useTabsListApiDescriptions = mapApiPageTranslations(useTabsListApiReq);

  const useTabsRootApiReq = require.context(
    'docs-base/translations/api-docs/use-tabs-root',
    false,
    /\.\/use-tabs-root.*.json$/,
  );
  const useTabsRootApiDescriptions = mapApiPageTranslations(useTabsRootApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        Tab: TabApiDescriptions,
        TabIndicator: TabIndicatorApiDescriptions,
        TabPanel: TabPanelApiDescriptions,
        TabsList: TabsListApiDescriptions,
        TabsRoot: TabsRootApiDescriptions,
      },
      componentsApiPageContents: {
        Tab: TabApiJsonPageContent,
        TabIndicator: TabIndicatorApiJsonPageContent,
        TabPanel: TabPanelApiJsonPageContent,
        TabsList: TabsListApiJsonPageContent,
        TabsRoot: TabsRootApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useTab: useTabApiDescriptions,
        useTabIndicator: useTabIndicatorApiDescriptions,
        useTabPanel: useTabPanelApiDescriptions,
        useTabsList: useTabsListApiDescriptions,
        useTabsRoot: useTabsRootApiDescriptions,
      },
      hooksApiPageContents: {
        useTab: useTabApiJsonPageContent,
        useTabIndicator: useTabIndicatorApiJsonPageContent,
        useTabPanel: useTabPanelApiJsonPageContent,
        useTabsList: useTabsListApiJsonPageContent,
        useTabsRoot: useTabsRootApiJsonPageContent,
      },
    },
  };
};
