import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { NOOP } from '@base-ui/utils/empty';
import { TemporalAdapter } from '../../types';
import { TemporalFieldState as State, TemporalFieldDatePart, TemporalFieldSection } from './types';
import type { FieldRootContext } from '../../field/root/FieldRootContext';
import { getTimezoneToRender, isDatePart, removeLocalizedDigits } from './utils';
import {
  getAriaValueText,
  getLocalizedDigits,
  getMeridiemsStr,
  getMonthsStr,
  getWeekDaysStr,
} from './adapter-cache';
import { temporalFieldSectionLabelKey } from '../../translations/types';

const SEPARATOR_STYLE: React.CSSProperties = { whiteSpace: 'pre' };

const adapterSelector = createSelector((state: State) => state.adapter);
const timezoneToRenderSelector = createSelectorMemoized(
  adapterSelector,
  (state: State) => state.manager,
  (state: State) => state.value,
  (state: State) => state.referenceDateProp,
  (state: State) => state.timezoneProp,
  getTimezoneToRender,
);
const requiredSelector = createSelector((state: State) => state.required);
const disabledSelector = createSelector(
  (state: State) => state.fieldContext?.state.disabled || state.disabledProp,
);
const readOnlySelector = createSelector((state: State) => state.readOnly);
const editableSelector = createSelector(
  (state: State) => !(state.fieldContext?.state.disabled || state.disabledProp) && !state.readOnly,
);
const invalidSelector = createSelector((state: State) => state.fieldContext?.invalid ?? false);
const nameSelector = createSelector((state: State) => state.fieldContext?.name ?? state.nameProp);
const idSelector = createSelector((state: State) => state.id);
const managerSelector = createSelector((state: State) => state.manager);
const configSelector = createSelector((state: State) => state.config);
const validationPropsSelector = createSelectorMemoized(
  (state: State) => state.minDate,
  (state: State) => state.maxDate,
  (minDate, maxDate) => ({ minDate, maxDate }),
);
const fieldContextSelector = createSelector((state: State) => state.fieldContext);
const stepSelector = createSelector((state: State) => state.step);
const inputRefSelector = createSelector((state: State) => state.inputRef);
const valueSelector = createSelector((state: State) => state.value);
const sectionsSelector = createSelector((state: State) => state.sections);
const areAllSectionsEmptySelector = createSelectorMemoized(
  (state: State) => state.sections,
  (sections) => sections.every((section) => !isDatePart(section) || section.value === ''),
);

const formatSelector = createSelector((state: State) => state.format);
const translationsSelector = createSelector((state: State) => state.translations);

export const selectors = {
  // Base
  timezoneToRender: timezoneToRenderSelector,
  required: requiredSelector,
  disabled: disabledSelector,
  readOnly: readOnlySelector,
  editable: editableSelector,
  invalid: invalidSelector,
  name: nameSelector,
  id: idSelector,
  adapter: adapterSelector,
  manager: managerSelector,
  config: configSelector,
  validationProps: validationPropsSelector,
  fieldContext: fieldContextSelector,
  step: stepSelector,
  inputRef: inputRefSelector,

  // CharacterEditing
  characterQuery: createSelector((state: State) => state.characterQuery),

  // Value
  value: valueSelector,
  referenceValue: createSelector((state: State) => state.referenceValue),

  // Section
  sections: sectionsSelector,
  selectedSection: createSelector((state: State) => state.selectedSection),
  areAllSectionsEmpty: areAllSectionsEmptySelector,
  datePart: createSelectorMemoized(
    (state: State) => state.sections,
    (sectionsList, sectionIndex: number) => {
      const section = sectionsList[sectionIndex];
      if (!isDatePart(section)) {
        return null;
      }

      return section;
    },
  ),
  activeDatePart: createSelectorMemoized(
    (state: State) => state.sections,
    (state: State) => state.selectedSection,
    (sectionsList, activeSectionIndex): TemporalFieldDatePart | null => {
      if (activeSectionIndex == null) {
        return null;
      }

      const activeSection = sectionsList[activeSectionIndex];
      if (!isDatePart(activeSection)) {
        return null;
      }

      return activeSection;
    },
  ),

  // Format
  format: formatSelector,

  // ElementsProps
  rootState: createSelectorMemoized(
    requiredSelector,
    readOnlySelector,
    disabledSelector,
    invalidSelector,
    fieldContextSelector,
    (required, readOnly, disabled, invalid, fieldContext: FieldRootContext | null) => ({
      ...(fieldContext?.state || {}),
      required,
      readOnly,
      disabled,
      invalid,
    }),
  ),
  hiddenInputProps: createSelectorMemoized(
    valueSelector,
    formatSelector,
    adapterSelector,
    configSelector,
    requiredSelector,
    disabledSelector,
    readOnlySelector,
    nameSelector,
    idSelector,
    validationPropsSelector,
    stepSelector,
    (
      value,
      format,
      adapter,
      config,
      required,
      disabled,
      readOnly,
      name,
      id,
      validationProps,
      step,
    ) => ({
      ...config.stringifyValidationPropsForHiddenInput(adapter, validationProps, format, step),
      type: config.hiddenInputType,
      value: config.stringifyValueForHiddenInput(adapter, value, format.granularity),
      name,
      id,
      disabled,
      readOnly,
      required,
      'aria-hidden': true,
      tabIndex: -1,
      style: visuallyHiddenInput,
    }),
  ),
  /**
   * Returns the params to pass to `useField` hook for form integration.
   */
  useFieldParams: createSelectorMemoized(
    idSelector,
    nameSelector,
    adapterSelector,
    configSelector,
    fieldContextSelector,
    inputRefSelector,
    valueSelector,
    formatSelector,
    (id, name, adapter, config, fieldContext, inputRef, value, format) => {
      const formValue = config.stringifyValueForHiddenInput(adapter, value, format.granularity);
      const commit = fieldContext != null ? fieldContext.validation.commit : NOOP;

      return {
        id,
        name,
        value: formValue,
        getValue: () => formValue,
        commit,
        controlRef: inputRef,
      };
    },
  ),
  sectionProps: createSelectorMemoized(
    adapterSelector,
    editableSelector,
    disabledSelector,
    readOnlySelector,
    timezoneToRenderSelector,
    translationsSelector,
    (
      adapter,
      editable,
      disabled,
      readOnly,
      timezone,
      translations,
      section: TemporalFieldSection,
    ): React.HTMLAttributes<HTMLDivElement> => {
      // Date part
      if (isDatePart(section)) {
        return {
          // Aria attributes
          'aria-readonly': readOnly,
          'aria-valuenow': getAriaValueNow(adapter, section),
          'aria-valuemin': section.token.boundaries.characterEditing.minimum,
          'aria-valuemax': section.token.boundaries.characterEditing.maximum,
          'aria-valuetext': section.value
            ? getAriaValueText(adapter, section, timezone)
            : translations.temporalFieldEmptySectionText,
          'aria-label': translations[temporalFieldSectionLabelKey[section.token.config.part]],
          'aria-disabled': disabled,

          // Other
          children: section.value || section.token.placeholder,
          tabIndex: editable ? 0 : -1,
          contentEditable: editable,
          suppressContentEditableWarning: true,
          role: 'spinbutton',
          spellCheck: editable ? false : undefined,
          // Firefox hydrates this as `'none`' instead of `'off'`. No problems in chromium with both values.
          // For reference https://github.com/mui/mui-x/issues/19012
          autoCapitalize: editable ? 'none' : undefined,
          autoCorrect: editable ? 'off' : undefined,
          inputMode: section.token.config.contentType === 'letter' ? 'text' : 'numeric',
        };
      }

      // Separator
      return {
        // Aria attributes
        'aria-hidden': true,

        // Other
        children: section.value,
        style: SEPARATOR_STYLE,
      };
    },
  ),
  clearPropsAndState: createSelectorMemoized(
    disabledSelector,
    readOnlySelector,
    areAllSectionsEmptySelector,
    (disabledFromState, readOnly, areAllSectionsEmpty, disabledProp: boolean) => ({
      props: {
        tabIndex: -1,
        children: '✕',
        'aria-readonly': readOnly || undefined,
      },
      state: {
        disabled: disabledFromState || disabledProp,
        empty: areAllSectionsEmpty,
      },
    }),
  ),
};

function getAriaValueNow(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
): number | undefined {
  if (section.value === '') {
    return undefined;
  }

  const localizedDigits = getLocalizedDigits(adapter);

  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'letter') {
        const index = getMonthsStr(adapter, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(removeLocalizedDigits(section.value, localizedDigits));
    }
    case 'weekDay': {
      if (section.token.config.contentType === 'letter') {
        const index = getWeekDaysStr(adapter, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(removeLocalizedDigits(section.value, localizedDigits));
    }
    case 'day':
      return parseInt(removeLocalizedDigits(section.value, localizedDigits), 10);
    case 'meridiem': {
      const index = getMeridiemsStr(adapter, section.token.value).indexOf(section.value);
      return index >= 0 ? index : undefined;
    }
    default:
      return section.token.config.contentType !== 'letter'
        ? Number(removeLocalizedDigits(section.value, localizedDigits))
        : undefined;
  }
}
