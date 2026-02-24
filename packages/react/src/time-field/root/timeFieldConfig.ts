import { TemporalAdapter, TemporalFieldDatePartType, TemporalValue } from '../../types';
import {
  TemporalFieldConfiguration,
  HiddenInputValidationProps,
} from '../../date-field/utils/types';
import { isDatePart } from '../../date-field/utils/utils';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getTimeManager } from '../../utils/temporal/getTimeManager';
/**
 * Formats a time value for native input.
 * Returns '' for invalid/empty input to trigger valueMissing validation if required.
 */
function formatTimeForNativeInput(
  adapter: TemporalAdapter,
  value: TemporalValue,
  granularity: TemporalFieldDatePartType,
): string {
  if (!adapter.isValid(value)) {
    return '';
  }

  const f = adapter.formats;
  return adapter.formatByString(
    value,
    granularity === 'seconds'
      ? `${f.hours24hPadded}:${f.minutesPadded}:${f.secondsPadded}`
      : `${f.hours24hPadded}:${f.minutesPadded}`,
  );
}

/**
 * Formats a time value for min/max attributes.
 * Always includes seconds for rounding purposes.
 */
function formatTimeForMinMax(adapter: TemporalAdapter, value: TemporalValue): string {
  return formatTimeForNativeInput(adapter, value, 'seconds');
}

/**
 * Multipliers to convert props.step to native input step (in seconds).
 */
const STEP_MULTIPLIERS: Partial<Record<TemporalFieldDatePartType, number>> = {
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

export const timeFieldConfig: TemporalFieldConfiguration<TemporalValue> = {
  getManager: getTimeManager,
  getSectionsFromValue: (date, getSectionsFromDate) => getSectionsFromDate(date),
  getDateFromSection: (value) => value,
  getDateSectionsFromValue: (sections) => sections,
  updateDateInValue: (value, activeSection, activeDate) => activeDate,
  parseValueStr: (valueStr, referenceValue, parseDate) =>
    parseDate(valueStr.trim(), referenceValue),
  getInitialReferenceValue: ({ value, ...other }) =>
    getInitialReferenceDate({ ...other, externalDate: value }),
  clearDateSections: (sections) =>
    sections.map((section) => (isDatePart(section) ? { ...section, value: '' } : section)),
  updateReferenceValue: (adapter, value, prevReferenceValue) =>
    adapter.isValid(value) ? value : prevReferenceValue,
  stringifyValue: (adapter, value) =>
    adapter.isValid(value) ? adapter.toJsDate(value).toISOString() : '',
  hiddenInputType: 'time',
  stringifyValueForHiddenInput: formatTimeForNativeInput,
  stringifyValidationPropsForHiddenInput: (adapter, validationProps, parsedFormat, step) => {
    // Use parsedFormat.granularity to determine step multiplier
    const multiplier = STEP_MULTIPLIERS[parsedFormat.granularity] ?? 60;
    const nativeStep = step * multiplier;

    const result: HiddenInputValidationProps = {
      step: String(nativeStep),
    };
    // Always include seconds in min/max for rounding purposes
    // Extract time portion from minDate/maxDate for the hidden input
    if (validationProps.minDate) {
      const formatted = formatTimeForMinMax(adapter, validationProps.minDate);
      if (formatted) {
        result.min = formatted;
      }
    }
    if (validationProps.maxDate) {
      const formatted = formatTimeForMinMax(adapter, validationProps.maxDate);
      if (formatted) {
        result.max = formatted;
      }
    }
    return result;
  },
};

export function getTimeFieldDefaultFormat(adapter: TemporalAdapter, ampm: boolean | undefined) {
  const ampmWithDefault = ampm ?? adapter.is12HourCycleInCurrentLocale();
  const f = adapter.formats;
  return ampmWithDefault
    ? `${f.hours12hPadded}:${f.minutesPadded} ${f.meridiem}`
    : `${f.hours24hPadded}:${f.minutesPadded}`;
}

export interface AmPmParameters {
  /**
   * Whether to use 12-hour format with AM/PM or 24-hour format.
   * Is ignored if a custom format is provided.
   * @default based on the current locale
   */
  ampm?: boolean | undefined;
}
