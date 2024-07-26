import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/menu/menu.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import MenuArrowApiJsonPageContent from '../../api/menu-arrow.json';
import MenuItemApiJsonPageContent from '../../api/menu-item.json';
import MenuPopupApiJsonPageContent from '../../api/menu-popup.json';
import MenuPositionerApiJsonPageContent from '../../api/menu-positioner.json';
import MenuRootApiJsonPageContent from '../../api/menu-root.json';
import MenuTriggerApiJsonPageContent from '../../api/menu-trigger.json';
import SubmenuTriggerApiJsonPageContent from '../../api/submenu-trigger.json';

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
  const MenuArrowApiReq = require.context(
    'docs-base/translations/api-docs/menu-arrow',
    false,
    /\.\/menu-arrow.*.json$/,
  );
  const MenuArrowApiDescriptions = mapApiPageTranslations(MenuArrowApiReq);

  const MenuItemApiReq = require.context(
    'docs-base/translations/api-docs/menu-item',
    false,
    /\.\/menu-item.*.json$/,
  );
  const MenuItemApiDescriptions = mapApiPageTranslations(MenuItemApiReq);

  const MenuPopupApiReq = require.context(
    'docs-base/translations/api-docs/menu-popup',
    false,
    /\.\/menu-popup.*.json$/,
  );
  const MenuPopupApiDescriptions = mapApiPageTranslations(MenuPopupApiReq);

  const MenuPositionerApiReq = require.context(
    'docs-base/translations/api-docs/menu-positioner',
    false,
    /\.\/menu-positioner.*.json$/,
  );
  const MenuPositionerApiDescriptions = mapApiPageTranslations(MenuPositionerApiReq);

  const MenuRootApiReq = require.context(
    'docs-base/translations/api-docs/menu-root',
    false,
    /\.\/menu-root.*.json$/,
  );
  const MenuRootApiDescriptions = mapApiPageTranslations(MenuRootApiReq);

  const MenuTriggerApiReq = require.context(
    'docs-base/translations/api-docs/menu-trigger',
    false,
    /\.\/menu-trigger.*.json$/,
  );
  const MenuTriggerApiDescriptions = mapApiPageTranslations(MenuTriggerApiReq);

  const SubmenuTriggerApiReq = require.context(
    'docs-base/translations/api-docs/submenu-trigger',
    false,
    /\.\/submenu-trigger.*.json$/,
  );
  const SubmenuTriggerApiDescriptions = mapApiPageTranslations(SubmenuTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        MenuArrow: MenuArrowApiDescriptions,
        MenuItem: MenuItemApiDescriptions,
        MenuPopup: MenuPopupApiDescriptions,
        MenuPositioner: MenuPositionerApiDescriptions,
        MenuRoot: MenuRootApiDescriptions,
        MenuTrigger: MenuTriggerApiDescriptions,
        SubmenuTrigger: SubmenuTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        MenuArrow: MenuArrowApiJsonPageContent,
        MenuItem: MenuItemApiJsonPageContent,
        MenuPopup: MenuPopupApiJsonPageContent,
        MenuPositioner: MenuPositionerApiJsonPageContent,
        MenuRoot: MenuRootApiJsonPageContent,
        MenuTrigger: MenuTriggerApiJsonPageContent,
        SubmenuTrigger: SubmenuTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
