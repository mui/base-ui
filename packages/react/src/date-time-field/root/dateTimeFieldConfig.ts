import { TemporalAdapter, TemporalFieldDatePartType, TemporalValue } from '../../types';
import {
  TemporalFieldConfiguration,
  HiddenInputValidationProps,
} from '../../date-field/utils/types';
import { isDatePart } from '../../date-field/utils/utils';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getDateTimeManager } from '../../utils/temporal/getDateTimeManager';
/**
 * Formats a datetime value for native input.
 * Returns '' for invalid/empty input to trigger valueMissing validation if required.
 */
function formatDateTimeForNativeInput(
  adapter: TemporalAdapter,
  value: TemporalValue,
  granularity: TemporalFieldDatePartType,
): string {
  if (!adapter.isValid(value)) {
    return '';
  }

  const f = adapter.formats;
  const c = adapter.escapedCharacters;
  return adapter.formatByString(
    value,
    granularity === 'seconds'
      ? `${f.yearPadded}-${f.monthPadded}-${f.dayOfMonthPadded}${c.start}T${c.end}${f.hours24hPadded}:${f.minutesPadded}:${f.secondsPadded}`
      : `${f.yearPadded}-${f.monthPadded}-${f.dayOfMonthPadded}${c.start}T${c.end}${f.hours24hPadded}:${f.minutesPadded}`,
  );
}

/**
 * Formats a datetime value for min/max attributes.
 * Always includes seconds for rounding purposes.
 */
function formatDateTimeForMinMax(adapter: TemporalAdapter, value: TemporalValue): string {
  return formatDateTimeForNativeInput(adapter, value, 'seconds');
}

/**
 * Multipliers to convert props.step to native input step (in seconds).
 */
const STEP_MULTIPLIERS: Partial<Record<TemporalFieldDatePartType, number>> = {
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

export const dateTimeFieldConfig: TemporalFieldConfiguration<TemporalValue> = {
  getManager: getDateTimeManager,
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
  hiddenInputType: 'datetime-local',
  stringifyValueForHiddenInput: formatDateTimeForNativeInput,
  stringifyValidationPropsForHiddenInput: (adapter, validationProps, parsedFormat, step) => {
    // Use parsedFormat.granularity to determine step multiplier
    const multiplier = STEP_MULTIPLIERS[parsedFormat.granularity] ?? 60;
    const nativeStep = step * multiplier;

    const result: HiddenInputValidationProps = {
      step: String(nativeStep),
    };

    // Always include seconds in min/max for rounding purposes
    if (validationProps.minDate) {
      const formatted = formatDateTimeForMinMax(adapter, validationProps.minDate);
      if (formatted) {
        result.min = formatted;
      }
    }
    if (validationProps.maxDate) {
      const formatted = formatDateTimeForMinMax(adapter, validationProps.maxDate);
      if (formatted) {
        result.max = formatted;
      }
    }

    return result;
  },
};

export function getDateTimeFieldDefaultFormat(adapter: TemporalAdapter, ampm: boolean | undefined) {
  const ampmWithDefault = ampm ?? adapter.is12HourCycleInCurrentLocale();
  const f = adapter.formats;
  const c = adapter.escapedCharacters;
  return ampmWithDefault
    ? `${f.localizedNumericDate}${c.start},${c.end} ${f.hours12hPadded}:${f.minutesPadded} ${f.meridiem}`
    : `${f.localizedNumericDate}${c.start},${c.end} ${f.hours24hPadded}:${f.minutesPadded}`;
}

export type { AmPmParameters } from '../../time-field/root/timeFieldConfig';
