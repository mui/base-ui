import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/select/select.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import SelectItemApiJsonPageContent from '../../api/select-item.json';
import SelectPopupApiJsonPageContent from '../../api/select-popup.json';
import SelectPositionerApiJsonPageContent from '../../api/select-positioner.json';
import SelectRootApiJsonPageContent from '../../api/select-root.json';
import SelectTriggerApiJsonPageContent from '../../api/select-trigger.json';

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
  const SelectItemApiReq = require.context(
    'docs-base/translations/api-docs/select-item',
    false,
    /\.\/select-item.*.json$/,
  );
  const SelectItemApiDescriptions = mapApiPageTranslations(SelectItemApiReq);

  const SelectPopupApiReq = require.context(
    'docs-base/translations/api-docs/select-popup',
    false,
    /\.\/select-popup.*.json$/,
  );
  const SelectPopupApiDescriptions = mapApiPageTranslations(SelectPopupApiReq);

  const SelectPositionerApiReq = require.context(
    'docs-base/translations/api-docs/select-positioner',
    false,
    /\.\/select-positioner.*.json$/,
  );
  const SelectPositionerApiDescriptions = mapApiPageTranslations(SelectPositionerApiReq);

  const SelectRootApiReq = require.context(
    'docs-base/translations/api-docs/select-root',
    false,
    /\.\/select-root.*.json$/,
  );
  const SelectRootApiDescriptions = mapApiPageTranslations(SelectRootApiReq);

  const SelectTriggerApiReq = require.context(
    'docs-base/translations/api-docs/select-trigger',
    false,
    /\.\/select-trigger.*.json$/,
  );
  const SelectTriggerApiDescriptions = mapApiPageTranslations(SelectTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        SelectItem: SelectItemApiDescriptions,
        SelectPopup: SelectPopupApiDescriptions,
        SelectPositioner: SelectPositionerApiDescriptions,
        SelectRoot: SelectRootApiDescriptions,
        SelectTrigger: SelectTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        SelectItem: SelectItemApiJsonPageContent,
        SelectPopup: SelectPopupApiJsonPageContent,
        SelectPositioner: SelectPositionerApiJsonPageContent,
        SelectRoot: SelectRootApiJsonPageContent,
        SelectTrigger: SelectTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
