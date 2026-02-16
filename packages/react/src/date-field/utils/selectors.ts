import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { NOOP } from '@base-ui/utils/empty';
import { TemporalAdapter, TemporalFieldDatePartType } from '../../types';
import {
  TemporalFieldState as State,
  TemporalFieldDatePart,
  TemporalFieldParsedFormat,
  TemporalFieldSection,
  TemporalFieldToken,
} from './types';
import { getTimezoneToRender, isDatePart, isToken } from './utils';
import { FormatParser } from './formatParser';
import { TemporalDateType } from '../../utils/temporal/types';
import { getAriaValueText, getMeridiemsStr, getMonthsStr, getWeekDaysStr } from './adapter-cache';

const SEPARATOR_STYLE: React.CSSProperties = { whiteSpace: 'pre' };

const translations = {
  empty: 'Empty',
  year: 'Year',
  month: 'Month',
  day: 'Day',
  weekDay: 'Week day',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  meridiem: 'Meridiem',
};

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

const parsedFormatSelector = createSelectorMemoized(
  adapterSelector,
  managerSelector,
  (state: State) => state.format,
  (state: State) => state.direction,
  (state: State) => state.placeholderGetters,
  validationPropsSelector,
  (adapter, manager, format, direction, placeholderGetters, validationProps) => {
    const parsed = FormatParser.parse(
      adapter,
      format,
      direction,
      placeholderGetters,
      validationProps,
    );
    validateFormat(parsed, manager.dateType);

    return parsed;
  },
);

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
  areAllSectionsEmpty: createSelector((state: State) =>
    state.sections.every((section) => !isDatePart(section) || section.value === ''),
  ),
  datePart: createSelectorMemoized(
    (state: State) => state.sections,
    (sectionsList, sectionIndex: number) => {
      if (!isDatePart(sectionsList[sectionIndex])) {
        return null;
      }

      return { ...sectionsList[sectionIndex], index: sectionIndex };
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

      return {
        ...activeSection,
        index: activeSectionIndex,
      };
    },
  ),

  // Format
  format: createSelector((state: State) => state.format),
  parsedFormat: parsedFormatSelector,

  // ElementsProps
  rootState: createSelectorMemoized(
    requiredSelector,
    readOnlySelector,
    disabledSelector,
    invalidSelector,
    fieldContextSelector,
    (required, readOnly, disabled, invalid, fieldContext: any) => ({
      ...(fieldContext?.state || {}),
      required,
      readOnly,
      disabled,
      invalid,
    }),
  ),
  hiddenInputProps: createSelectorMemoized(
    valueSelector,
    parsedFormatSelector,
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
      parsedFormat,
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
      ...config.stringifyValidationPropsForHiddenInput(
        adapter,
        validationProps,
        parsedFormat,
        step,
      ),
      type: config.hiddenInputType,
      value: config.stringifyValueForHiddenInput(adapter, value, parsedFormat.granularity),
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
    parsedFormatSelector,
    (id, name, adapter, config, fieldContext, inputRef, value, parsedFormat) => {
      const formValue = config.stringifyValueForHiddenInput(
        adapter,
        value,
        parsedFormat.granularity,
      );
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
    (
      adapter,
      editable,
      disabled,
      readOnly,
      timezone,
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
            : translations.empty,
          'aria-label': translations[section.token.config.part],
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
  clearProps: createSelectorMemoized(
    disabledSelector,
    readOnlySelector,
    (disabled, readOnly): React.HTMLAttributes<HTMLButtonElement> => ({
      tabIndex: -1,
      children: '✕',
      'aria-readonly': readOnly || undefined,
      'aria-disabled': disabled || undefined,
    }),
  ),
};

function validateFormat(parsedFormat: TemporalFieldParsedFormat, dateType: TemporalDateType) {
  if (process.env.NODE_ENV !== 'production') {
    const supportedSections: TemporalFieldDatePartType[] = [];
    if (['date', 'date-time'].includes(dateType)) {
      supportedSections.push('weekDay', 'day', 'month', 'year');
    }
    if (['time', 'date-time'].includes(dateType)) {
      supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
    }

    const invalidDatePartEl = parsedFormat.elements.find(
      (element) => isToken(element) && !supportedSections.includes(element.config.part),
    ) as TemporalFieldToken | undefined;

    if (invalidDatePartEl) {
      warn(
        `Base UI: The field component you are using is not compatible with the "${invalidDatePartEl.config.part}" date section.`,
        `The supported date parts are ["${supportedSections.join('", "')}"]\`.`,
      );
    }
  }
}

function getAriaValueNow(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
): number | undefined {
  if (section.value === '') {
    return undefined;
  }

  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'letter') {
        const index = getMonthsStr(adapter, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(section.value);
    }
    case 'weekDay': {
      if (section.token.config.contentType === 'letter') {
        const index = getWeekDaysStr(adapter, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(section.value);
    }
    case 'day':
      return parseInt(section.value, 10);
    case 'meridiem': {
      const index = getMeridiemsStr(adapter, section.token.value).indexOf(section.value);
      return index >= 0 ? index : undefined;
    }
    default:
      return section.token.config.contentType !== 'letter' ? Number(section.value) : undefined;
  }
}
