import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/select/select.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import SelectBackdropApiJsonPageContent from '../../api/select-backdrop.json';
import SelectOptionApiJsonPageContent from '../../api/select-option.json';
import SelectOptionGroupApiJsonPageContent from '../../api/select-option-group.json';
import SelectOptionGroupLabelApiJsonPageContent from '../../api/select-option-group-label.json';
import SelectOptionIndicatorApiJsonPageContent from '../../api/select-option-indicator.json';
import SelectPopupApiJsonPageContent from '../../api/select-popup.json';
import SelectPositionerApiJsonPageContent from '../../api/select-positioner.json';
import SelectRootApiJsonPageContent from '../../api/select-root.json';
import SelectScrollDownArrowApiJsonPageContent from '../../api/select-scroll-down-arrow.json';
import SelectScrollUpArrowApiJsonPageContent from '../../api/select-scroll-up-arrow.json';
import SelectSeparatorApiJsonPageContent from '../../api/select-separator.json';
import SelectTriggerApiJsonPageContent from '../../api/select-trigger.json';
import SelectValueApiJsonPageContent from '../../api/select-value.json';

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
  const SelectBackdropApiReq = require.context(
    'docs-base/translations/api-docs/select-backdrop',
    false,
    /\.\/select-backdrop.*.json$/,
  );
  const SelectBackdropApiDescriptions = mapApiPageTranslations(SelectBackdropApiReq);

  const SelectOptionApiReq = require.context(
    'docs-base/translations/api-docs/select-option',
    false,
    /\.\/select-option.*.json$/,
  );
  const SelectOptionApiDescriptions = mapApiPageTranslations(SelectOptionApiReq);

  const SelectOptionGroupApiReq = require.context(
    'docs-base/translations/api-docs/select-option-group',
    false,
    /\.\/select-option-group.*.json$/,
  );
  const SelectOptionGroupApiDescriptions = mapApiPageTranslations(SelectOptionGroupApiReq);

  const SelectOptionGroupLabelApiReq = require.context(
    'docs-base/translations/api-docs/select-option-group-label',
    false,
    /\.\/select-option-group-label.*.json$/,
  );
  const SelectOptionGroupLabelApiDescriptions = mapApiPageTranslations(
    SelectOptionGroupLabelApiReq,
  );

  const SelectOptionIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/select-option-indicator',
    false,
    /\.\/select-option-indicator.*.json$/,
  );
  const SelectOptionIndicatorApiDescriptions = mapApiPageTranslations(SelectOptionIndicatorApiReq);

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

  const SelectScrollDownArrowApiReq = require.context(
    'docs-base/translations/api-docs/select-scroll-down-arrow',
    false,
    /\.\/select-scroll-down-arrow.*.json$/,
  );
  const SelectScrollDownArrowApiDescriptions = mapApiPageTranslations(SelectScrollDownArrowApiReq);

  const SelectScrollUpArrowApiReq = require.context(
    'docs-base/translations/api-docs/select-scroll-up-arrow',
    false,
    /\.\/select-scroll-up-arrow.*.json$/,
  );
  const SelectScrollUpArrowApiDescriptions = mapApiPageTranslations(SelectScrollUpArrowApiReq);

  const SelectSeparatorApiReq = require.context(
    'docs-base/translations/api-docs/select-separator',
    false,
    /\.\/select-separator.*.json$/,
  );
  const SelectSeparatorApiDescriptions = mapApiPageTranslations(SelectSeparatorApiReq);

  const SelectTriggerApiReq = require.context(
    'docs-base/translations/api-docs/select-trigger',
    false,
    /\.\/select-trigger.*.json$/,
  );
  const SelectTriggerApiDescriptions = mapApiPageTranslations(SelectTriggerApiReq);

  const SelectValueApiReq = require.context(
    'docs-base/translations/api-docs/select-value',
    false,
    /\.\/select-value.*.json$/,
  );
  const SelectValueApiDescriptions = mapApiPageTranslations(SelectValueApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        SelectBackdrop: SelectBackdropApiDescriptions,
        SelectOption: SelectOptionApiDescriptions,
        SelectOptionGroup: SelectOptionGroupApiDescriptions,
        SelectOptionGroupLabel: SelectOptionGroupLabelApiDescriptions,
        SelectOptionIndicator: SelectOptionIndicatorApiDescriptions,
        SelectPopup: SelectPopupApiDescriptions,
        SelectPositioner: SelectPositionerApiDescriptions,
        SelectRoot: SelectRootApiDescriptions,
        SelectScrollDownArrow: SelectScrollDownArrowApiDescriptions,
        SelectScrollUpArrow: SelectScrollUpArrowApiDescriptions,
        SelectSeparator: SelectSeparatorApiDescriptions,
        SelectTrigger: SelectTriggerApiDescriptions,
        SelectValue: SelectValueApiDescriptions,
      },
      componentsApiPageContents: {
        SelectBackdrop: SelectBackdropApiJsonPageContent,
        SelectOption: SelectOptionApiJsonPageContent,
        SelectOptionGroup: SelectOptionGroupApiJsonPageContent,
        SelectOptionGroupLabel: SelectOptionGroupLabelApiJsonPageContent,
        SelectOptionIndicator: SelectOptionIndicatorApiJsonPageContent,
        SelectPopup: SelectPopupApiJsonPageContent,
        SelectPositioner: SelectPositionerApiJsonPageContent,
        SelectRoot: SelectRootApiJsonPageContent,
        SelectScrollDownArrow: SelectScrollDownArrowApiJsonPageContent,
        SelectScrollUpArrow: SelectScrollUpArrowApiJsonPageContent,
        SelectSeparator: SelectSeparatorApiJsonPageContent,
        SelectTrigger: SelectTriggerApiJsonPageContent,
        SelectValue: SelectValueApiJsonPageContent,
      },
      hooksApiDescriptions: {},
      hooksApiPageContents: {},
    },
  };
};
