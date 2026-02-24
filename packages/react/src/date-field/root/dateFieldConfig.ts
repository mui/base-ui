import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldConfiguration, HiddenInputValidationProps } from '../utils/types';
import { isDatePart } from '../utils/utils';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getDateManager } from '../../utils/temporal/getDateManager';
/**
 * Formats a date value for native input.
 * Returns '' for invalid/empty input to trigger valueMissing validation if required.
 */
function formatDateForNativeInput(adapter: TemporalAdapter, value: TemporalValue): string {
  if (!adapter.isValid(value)) {
    return '';
  }
  const f = adapter.formats;
  return adapter.formatByString(value, `${f.yearPadded}-${f.monthPadded}-${f.dayOfMonthPadded}`);
}

export const dateFieldConfig: TemporalFieldConfiguration<TemporalValue> = {
  getManager: getDateManager,
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
  hiddenInputType: 'date',
  stringifyValueForHiddenInput: formatDateForNativeInput,
  stringifyValidationPropsForHiddenInput: (adapter, validationProps) => {
    const result: HiddenInputValidationProps = {};
    if (validationProps.minDate) {
      const formatted = formatDateForNativeInput(adapter, validationProps.minDate);
      if (formatted) {
        result.min = formatted;
      }
    }
    if (validationProps.maxDate) {
      const formatted = formatDateForNativeInput(adapter, validationProps.maxDate);
      if (formatted) {
        result.max = formatted;
      }
    }
    return result;
  },
};

export function getDateFieldDefaultFormat(adapter: TemporalAdapter) {
  return adapter.formats.localizedNumericDate;
}
