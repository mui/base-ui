import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import {
  TemporalAdapter,
  TemporalFieldDatePartType,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import {
  TemporalFieldState as State,
  TemporalFieldDatePart,
  TemporalFieldParsedFormat,
  TemporalFieldSection,
  TemporalFieldToken,
} from './types';
import { getTimezoneToRender, isDatePart, isToken } from './utils';
import { FormatParser } from './formatParser';
import { TemporalDateType } from '../types';
import {
  getArbitraryDate,
  getLongestMonthInCurrentYear,
  getMeridiemsStr,
  getMonthsStr,
  getWeekDaysStr,
} from './adapter-cache';
import type { TemporalFieldStore } from './TemporalFieldStore';

// =============================================
// Base selectors (from original selectors.ts)
// =============================================

const timezoneToRender = createSelectorMemoized(
  (state: State) => state.adapter,
  (state: State) => state.manager,
  (state: State) => state.value,
  (state: State) => state.referenceDateProp,
  (state: State) => state.timezoneProp,
  getTimezoneToRender,
);
const required = createSelector((state: State) => state.required);
const disabled = createSelector(
  (state: State) => state.fieldContext?.state.disabled || state.disabledProp,
);
const readOnly = createSelector((state: State) => state.readOnly);
const editable = createSelector(
  (state: State) =>
    !(state.fieldContext?.state.disabled || state.disabledProp) && !state.readOnly,
);
const invalid = createSelector((state: State) => state.fieldContext?.invalid ?? false);
const name = createSelector((state: State) => state.fieldContext?.name ?? state.nameProp);
const id = createSelector((state: State) => state.id);
const adapter = createSelector((state: State) => state.adapter);
const manager = createSelector((state: State) => state.manager);
const config = createSelector((state: State) => state.config);
const validationProps = createSelectorMemoized(
  (state: State) => state.minDate,
  (state: State) => state.maxDate,
  (minDate, maxDate) => ({ minDate, maxDate }),
);
const fieldContext = createSelector((state: State) => state.fieldContext);
const step = createSelector((state: State) => state.step);
const inputRef = createSelector((state: State) => state.inputRef);

// =============================================
// CharacterEditing selectors
// =============================================

const characterQuery = createSelector((state: State) => state.characterQuery);

// =============================================
// Value selectors
// =============================================

const value = createSelector((state: State) => state.value);
const referenceValue = createSelector((state: State) => state.referenceValue);

// =============================================
// Section selectors
// =============================================

const sections = createSelector((state: State) => state.sections);
const selectedSection = createSelector((state: State) => state.selectedSection);
const areAllSectionsEmpty = createSelector((state: State) =>
  state.sections.every((section) => !isDatePart(section) || section.value === ''),
);
const datePart = createSelectorMemoized(
  (state: State) => state.sections,
  (sectionsList, sectionIndex: number) => {
    if (!isDatePart(sectionsList[sectionIndex])) {
      return null;
    }

    return { ...sectionsList[sectionIndex], index: sectionIndex };
  },
);
const activeDatePart = createSelectorMemoized(
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
);

// =============================================
// Format selectors
// =============================================

const format = createSelector((state: State) => state.format);
const parsedFormat = createSelectorMemoized(
  adapter,
  manager,
  (state: State) => state.format,
  (state: State) => state.direction,
  (state: State) => state.placeholderGetters,
  validationProps,
  (adapterVal, managerVal, formatVal, direction, placeholderGetters, validationPropsVal) => {
    const parsed = FormatParser.parse(
      adapterVal,
      formatVal,
      direction,
      placeholderGetters,
      validationPropsVal,
    );
    validateFormat(parsed, managerVal.dateType);

    return parsed;
  },
);

// =============================================
// ElementsProps selectors
// =============================================

const rootState = createSelectorMemoized(
  required,
  readOnly,
  disabled,
  invalid,
  fieldContext,
  (requiredVal, readOnlyVal, disabledVal, invalidVal, fieldContextVal: any) => ({
    ...(fieldContextVal?.state || {}),
    required: requiredVal,
    readOnly: readOnlyVal,
    disabled: disabledVal,
    invalid: invalidVal,
  }),
);
const rootProps = createSelectorMemoized(
  sections,
  (state: State) => state.children,
  (sectionsList, children, store: TemporalFieldStore<any>) => {
    const resolvedChildren =
      typeof children === 'function'
        ? sectionsList.map((section) => children(section))
        : children;

    return {
      onClick: store.handleRootClick,
      children: resolvedChildren,
    };
  },
);
const hiddenInputProps = createSelectorMemoized(
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
  (
    valueVal,
    parsedFormatVal,
    adapterVal,
    configVal,
    requiredVal,
    disabledVal,
    readOnlyVal,
    nameVal,
    idVal,
    validationPropsVal,
    stepVal,
    store: TemporalFieldStore<any>,
  ) => ({
    ...configVal.stringifyValidationPropsForHiddenInput(
      adapterVal,
      validationPropsVal,
      parsedFormatVal,
      stepVal,
    ),
    type: configVal.hiddenInputType,
    value: configVal.stringifyValueForHiddenInput(adapterVal, valueVal, parsedFormatVal.granularity),
    name: nameVal,
    id: idVal,
    disabled: disabledVal,
    readOnly: readOnlyVal,
    required: requiredVal,
    'aria-hidden': true,
    tabIndex: -1,
    style: visuallyHiddenInput,
    onChange: store.handleHiddenInputChange,
    onFocus: store.handleHiddenInputFocus,
  }),
);
/**
 * Returns the params to pass to `useField` hook for form integration.
 */
const useFieldParams = createSelectorMemoized(
  id,
  name,
  adapter,
  config,
  fieldContext,
  inputRef,
  value,
  parsedFormat,
  (idVal, nameVal, adapterVal, configVal, fieldContextVal, inputRefVal, valueVal, parsedFormatVal) => {
    const formValue = configVal.stringifyValueForHiddenInput(
      adapterVal,
      valueVal,
      parsedFormatVal.granularity,
    );
    return {
      id: idVal,
      name: nameVal,
      value: formValue,
      getValue: () => formValue,
      commit: fieldContextVal?.validation.commit ?? (async () => {}),
      controlRef: inputRefVal,
    };
  },
);
const sectionProps = createSelectorMemoized(
  (state: State) => state.adapter,
  editable,
  disabled,
  readOnly,
  timezoneToRender,
  (
    adapterVal,
    editableVal,
    disabledVal,
    readOnlyVal,
    timezone,
    section: TemporalFieldSection,
    store: TemporalFieldStore<any>,
  ): React.HTMLAttributes<HTMLDivElement> => {
    const eventHandlers = {
      onClick: store.handleSectionClick,
      onInput: store.handleSectionInput,
      onPaste: store.handleSectionPaste,
      onKeyDown: store.handleSectionKeyDown,
      onMouseUp: store.handleSectionMouseUp,
      onDragOver: store.handleSectionDragOver,
      onFocus: store.handleSectionFocus,
      onBlur: store.handleSectionBlur,
    };

    // Date part
    if (isDatePart(section)) {
      return {
        // Aria attributes
        'aria-readonly': readOnlyVal,
        'aria-valuenow': getAriaValueNow(adapterVal, section),
        'aria-valuemin': section.token.boundaries.characterEditing.minimum,
        'aria-valuemax': section.token.boundaries.characterEditing.maximum,
        'aria-valuetext': section.value
          ? getAriaValueText(adapterVal, section, timezone)
          : translations.empty,
        'aria-label': translations[section.token.config.part],
        'aria-disabled': disabledVal,

        // Other
        children: section.value || section.token.placeholder,
        tabIndex: editableVal ? 0 : -1,
        contentEditable: editableVal,
        suppressContentEditableWarning: true,
        role: 'spinbutton',
        spellCheck: editableVal ? false : undefined,
        // Firefox hydrates this as `'none`' instead of `'off'`. No problems in chromium with both values.
        // For reference https://github.com/mui/mui-x/issues/19012
        autoCapitalize: editableVal ? 'none' : undefined,
        autoCorrect: editableVal ? 'off' : undefined,
        inputMode: section.token.config.contentType === 'letter' ? 'text' : 'numeric',

        // Event handlers
        ...eventHandlers,
      };
    }

    // Separator
    return {
      // Aria attributes
      'aria-hidden': true,

      // Other
      children: section.value,
      style: { whiteSpace: 'pre' },

      // Event handlers
      ...eventHandlers,
    };
  },
);
const clearProps = createSelectorMemoized(
  disabled,
  readOnly,
  (
    disabledVal,
    readOnlyVal,
    store: TemporalFieldStore<any>,
  ): React.HTMLAttributes<HTMLButtonElement> => ({
    tabIndex: -1,
    children: '✕',
    'aria-readonly': readOnlyVal || undefined,
    'aria-disabled': disabledVal || undefined,
    onMouseDown: store.handleClearMouseDown,
    onClick: store.handleClearClick,
  }),
);

// =============================================
// Exported selectors object
// =============================================

export const selectors = {
  // Base
  timezoneToRender,
  required,
  disabled,
  readOnly,
  editable,
  invalid,
  name,
  id,
  adapter,
  manager,
  config,
  validationProps,
  fieldContext,
  step,
  inputRef,
  // CharacterEditing
  characterQuery,
  // Value
  value,
  referenceValue,
  // Section
  sections,
  selectedSection,
  areAllSectionsEmpty,
  datePart,
  activeDatePart,
  // Format
  format,
  parsedFormat,
  // ElementsProps
  rootState,
  rootProps,
  hiddenInputProps,
  useFieldParams,
  sectionProps,
  clearProps,
};

// =============================================
// Helper functions used by selectors
// =============================================

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

function validateFormat(parsedFormatVal: TemporalFieldParsedFormat, dateType: TemporalDateType) {
  if (process.env.NODE_ENV !== 'production') {
    const supportedSections: TemporalFieldDatePartType[] = [];
    if (['date', 'date-time'].includes(dateType)) {
      supportedSections.push('weekDay', 'day', 'month', 'year');
    }
    if (['time', 'date-time'].includes(dateType)) {
      supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
    }

    const invalidDatePartEl = parsedFormatVal.elements.find(
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
  adapterVal: TemporalAdapter,
  section: TemporalFieldDatePart,
): number | undefined {
  if (section.value === '') {
    return undefined;
  }

  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'letter') {
        const index = getMonthsStr(adapterVal, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(section.value);
    }
    case 'weekDay': {
      if (section.token.config.contentType === 'letter') {
        const index = getWeekDaysStr(adapterVal, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(section.value);
    }
    case 'day':
      return parseInt(section.value, 10);
    case 'meridiem': {
      const index = getMeridiemsStr(adapterVal, section.token.value).indexOf(section.value);
      return index >= 0 ? index : undefined;
    }
    default:
      return section.token.config.contentType !== 'letter' ? Number(section.value) : undefined;
  }
}

function getAriaValueText(
  adapterVal: TemporalAdapter,
  section: TemporalFieldDatePart,
  timezone: TemporalTimezone,
): string | undefined {
  if (section.value === '') {
    return undefined;
  }

  const arbitraryDate = getArbitraryDate(adapterVal);
  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'digit') {
        const dateWithMonth = adapterVal.setMonth(
          adapterVal.startOfYear(arbitraryDate),
          Number(section.value) - 1,
        );
        return adapterVal.isValid(dateWithMonth)
          ? adapterVal.format(dateWithMonth, 'monthFullLetter')
          : '';
      }
      const parsedDate = adapterVal.parse(section.value, section.token.value, timezone);
      return parsedDate && adapterVal.isValid(parsedDate)
        ? adapterVal.format(parsedDate, 'monthFullLetter')
        : undefined;
    }
    case 'day':
      if (section.token.config.contentType === 'digit') {
        const dateWithDay = adapterVal.setDate(
          getLongestMonthInCurrentYear(adapterVal),
          Number(section.value),
        );
        return adapterVal.isValid(dateWithDay)
          ? adapterVal.format(dateWithDay, 'dayOfMonthWithLetter')
          : '';
      }
      return section.value;
    case 'weekDay': {
      const startOfWeekDate = adapterVal.startOfWeek(arbitraryDate);
      if (section.token.config.contentType === 'digit') {
        const dateWithWeekDay = adapterVal.addDays(startOfWeekDate, Number(section.value) - 1);
        return adapterVal.isValid(dateWithWeekDay)
          ? adapterVal.format(dateWithWeekDay, 'weekday')
          : '';
      }
      const formattedDaysInWeek = getWeekDaysStr(adapterVal, section.token.value);
      const index = formattedDaysInWeek.indexOf(section.value);
      if (index < 0) {
        return undefined;
      }
      const dateWithWeekDay = adapterVal.addDays(startOfWeekDate, index);
      return adapterVal.isValid(dateWithWeekDay)
        ? adapterVal.format(dateWithWeekDay, 'weekday')
        : undefined;
    }
    default:
      return undefined;
  }
}
