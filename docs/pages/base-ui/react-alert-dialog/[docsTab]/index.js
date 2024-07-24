import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/alert-dialog/alert-dialog.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import AlertDialogBackdropApiJsonPageContent from '../../api/alert-dialog-backdrop.json';
import AlertDialogCloseApiJsonPageContent from '../../api/alert-dialog-close.json';
import AlertDialogDescriptionApiJsonPageContent from '../../api/alert-dialog-description.json';
import AlertDialogPopupApiJsonPageContent from '../../api/alert-dialog-popup.json';
import AlertDialogRootApiJsonPageContent from '../../api/alert-dialog-root.json';
import AlertDialogTitleApiJsonPageContent from '../../api/alert-dialog-title.json';
import AlertDialogTriggerApiJsonPageContent from '../../api/alert-dialog-trigger.json';

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
  const AlertDialogBackdropApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-backdrop',
    false,
    /\.\/alert-dialog-backdrop.*.json$/,
  );
  const AlertDialogBackdropApiDescriptions = mapApiPageTranslations(AlertDialogBackdropApiReq);

  const AlertDialogCloseApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-close',
    false,
    /\.\/alert-dialog-close.*.json$/,
  );
  const AlertDialogCloseApiDescriptions = mapApiPageTranslations(AlertDialogCloseApiReq);

  const AlertDialogDescriptionApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-description',
    false,
    /\.\/alert-dialog-description.*.json$/,
  );
  const AlertDialogDescriptionApiDescriptions = mapApiPageTranslations(
    AlertDialogDescriptionApiReq,
  );

  const AlertDialogPopupApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-popup',
    false,
    /\.\/alert-dialog-popup.*.json$/,
  );
  const AlertDialogPopupApiDescriptions = mapApiPageTranslations(AlertDialogPopupApiReq);

  const AlertDialogRootApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-root',
    false,
    /\.\/alert-dialog-root.*.json$/,
  );
  const AlertDialogRootApiDescriptions = mapApiPageTranslations(AlertDialogRootApiReq);

  const AlertDialogTitleApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-title',
    false,
    /\.\/alert-dialog-title.*.json$/,
  );
  const AlertDialogTitleApiDescriptions = mapApiPageTranslations(AlertDialogTitleApiReq);

  const AlertDialogTriggerApiReq = require.context(
    'docs-base/translations/api-docs/alert-dialog-trigger',
    false,
    /\.\/alert-dialog-trigger.*.json$/,
  );
  const AlertDialogTriggerApiDescriptions = mapApiPageTranslations(AlertDialogTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        AlertDialogBackdrop: AlertDialogBackdropApiDescriptions,
        AlertDialogClose: AlertDialogCloseApiDescriptions,
        AlertDialogDescription: AlertDialogDescriptionApiDescriptions,
        AlertDialogPopup: AlertDialogPopupApiDescriptions,
        AlertDialogRoot: AlertDialogRootApiDescriptions,
        AlertDialogTitle: AlertDialogTitleApiDescriptions,
        AlertDialogTrigger: AlertDialogTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        AlertDialogBackdrop: AlertDialogBackdropApiJsonPageContent,
        AlertDialogClose: AlertDialogCloseApiJsonPageContent,
        AlertDialogDescription: AlertDialogDescriptionApiJsonPageContent,
        AlertDialogPopup: AlertDialogPopupApiJsonPageContent,
        AlertDialogRoot: AlertDialogRootApiJsonPageContent,
        AlertDialogTitle: AlertDialogTitleApiJsonPageContent,
        AlertDialogTrigger: AlertDialogTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
