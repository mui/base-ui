import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/dialog/dialog.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import DialogBackdropApiJsonPageContent from '../../api/dialog-backdrop.json';
import DialogCloseApiJsonPageContent from '../../api/dialog-close.json';
import DialogDescriptionApiJsonPageContent from '../../api/dialog-description.json';
import DialogPopupApiJsonPageContent from '../../api/dialog-popup.json';
import DialogRootApiJsonPageContent from '../../api/dialog-root.json';
import DialogTitleApiJsonPageContent from '../../api/dialog-title.json';
import DialogTriggerApiJsonPageContent from '../../api/dialog-trigger.json';
import useDialogCloseApiJsonPageContent from '../../api/use-dialog-close.json';
import useDialogDescriptionApiJsonPageContent from '../../api/use-dialog-description.json';
import useDialogPopupApiJsonPageContent from '../../api/use-dialog-popup.json';
import useDialogRootApiJsonPageContent from '../../api/use-dialog-root.json';
import useDialogTitleApiJsonPageContent from '../../api/use-dialog-title.json';
import useDialogTriggerApiJsonPageContent from '../../api/use-dialog-trigger.json';

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
  const DialogBackdropApiReq = require.context(
    'docs-base/translations/api-docs/dialog-backdrop',
    false,
    /\.\/dialog-backdrop.*.json$/,
  );
  const DialogBackdropApiDescriptions = mapApiPageTranslations(DialogBackdropApiReq);

  const DialogCloseApiReq = require.context(
    'docs-base/translations/api-docs/dialog-close',
    false,
    /\.\/dialog-close.*.json$/,
  );
  const DialogCloseApiDescriptions = mapApiPageTranslations(DialogCloseApiReq);

  const DialogDescriptionApiReq = require.context(
    'docs-base/translations/api-docs/dialog-description',
    false,
    /\.\/dialog-description.*.json$/,
  );
  const DialogDescriptionApiDescriptions = mapApiPageTranslations(DialogDescriptionApiReq);

  const DialogPopupApiReq = require.context(
    'docs-base/translations/api-docs/dialog-popup',
    false,
    /\.\/dialog-popup.*.json$/,
  );
  const DialogPopupApiDescriptions = mapApiPageTranslations(DialogPopupApiReq);

  const DialogRootApiReq = require.context(
    'docs-base/translations/api-docs/dialog-root',
    false,
    /\.\/dialog-root.*.json$/,
  );
  const DialogRootApiDescriptions = mapApiPageTranslations(DialogRootApiReq);

  const DialogTitleApiReq = require.context(
    'docs-base/translations/api-docs/dialog-title',
    false,
    /\.\/dialog-title.*.json$/,
  );
  const DialogTitleApiDescriptions = mapApiPageTranslations(DialogTitleApiReq);

  const DialogTriggerApiReq = require.context(
    'docs-base/translations/api-docs/dialog-trigger',
    false,
    /\.\/dialog-trigger.*.json$/,
  );
  const DialogTriggerApiDescriptions = mapApiPageTranslations(DialogTriggerApiReq);

  const useDialogCloseApiReq = require.context(
    'docs-base/translations/api-docs/use-dialog-close',
    false,
    /\.\/use-dialog-close.*.json$/,
  );
  const useDialogCloseApiDescriptions = mapApiPageTranslations(useDialogCloseApiReq);

  const useDialogDescriptionApiReq = require.context(
    'docs-base/translations/api-docs/use-dialog-description',
    false,
    /\.\/use-dialog-description.*.json$/,
  );
  const useDialogDescriptionApiDescriptions = mapApiPageTranslations(useDialogDescriptionApiReq);

  const useDialogPopupApiReq = require.context(
    'docs-base/translations/api-docs/use-dialog-popup',
    false,
    /\.\/use-dialog-popup.*.json$/,
  );
  const useDialogPopupApiDescriptions = mapApiPageTranslations(useDialogPopupApiReq);

  const useDialogRootApiReq = require.context(
    'docs-base/translations/api-docs/use-dialog-root',
    false,
    /\.\/use-dialog-root.*.json$/,
  );
  const useDialogRootApiDescriptions = mapApiPageTranslations(useDialogRootApiReq);

  const useDialogTitleApiReq = require.context(
    'docs-base/translations/api-docs/use-dialog-title',
    false,
    /\.\/use-dialog-title.*.json$/,
  );
  const useDialogTitleApiDescriptions = mapApiPageTranslations(useDialogTitleApiReq);

  const useDialogTriggerApiReq = require.context(
    'docs-base/translations/api-docs/use-dialog-trigger',
    false,
    /\.\/use-dialog-trigger.*.json$/,
  );
  const useDialogTriggerApiDescriptions = mapApiPageTranslations(useDialogTriggerApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        DialogBackdrop: DialogBackdropApiDescriptions,
        DialogClose: DialogCloseApiDescriptions,
        DialogDescription: DialogDescriptionApiDescriptions,
        DialogPopup: DialogPopupApiDescriptions,
        DialogRoot: DialogRootApiDescriptions,
        DialogTitle: DialogTitleApiDescriptions,
        DialogTrigger: DialogTriggerApiDescriptions,
      },
      componentsApiPageContents: {
        DialogBackdrop: DialogBackdropApiJsonPageContent,
        DialogClose: DialogCloseApiJsonPageContent,
        DialogDescription: DialogDescriptionApiJsonPageContent,
        DialogPopup: DialogPopupApiJsonPageContent,
        DialogRoot: DialogRootApiJsonPageContent,
        DialogTitle: DialogTitleApiJsonPageContent,
        DialogTrigger: DialogTriggerApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useDialogClose: useDialogCloseApiDescriptions,
        useDialogDescription: useDialogDescriptionApiDescriptions,
        useDialogPopup: useDialogPopupApiDescriptions,
        useDialogRoot: useDialogRootApiDescriptions,
        useDialogTitle: useDialogTitleApiDescriptions,
        useDialogTrigger: useDialogTriggerApiDescriptions,
      },
      hooksApiPageContents: {
        useDialogClose: useDialogCloseApiJsonPageContent,
        useDialogDescription: useDialogDescriptionApiJsonPageContent,
        useDialogPopup: useDialogPopupApiJsonPageContent,
        useDialogRoot: useDialogRootApiJsonPageContent,
        useDialogTitle: useDialogTitleApiJsonPageContent,
        useDialogTrigger: useDialogTriggerApiJsonPageContent,
      },
    },
  };
};
