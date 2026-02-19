import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../utils/TemporalFieldStore';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
  HiddenInputValidationProps,
} from '../utils/types';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getDateManager } from '../../utils/temporal/getDateManager';
import { TextDirection } from '../../direction-provider';
import { MakeOptional } from '../../utils/types';

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

const config: TemporalFieldConfiguration<TemporalValue> = {
  getManager: getDateManager,
  getSectionsFromValue: (date, getSectionsFromDate) => getSectionsFromDate(date),
  getDateFromSection: (value) => value,
  getDateSectionsFromValue: (sections) => sections,
  updateDateInValue: (value, activeSection, activeDate) => activeDate,
  parseValueStr: (valueStr, referenceValue, parseDate) =>
    parseDate(valueStr.trim(), referenceValue),
  getInitialReferenceValue: ({ value, ...other }) =>
    getInitialReferenceDate({ ...other, externalDate: value }),
  clearDateSections: (sections) => sections.map((section) => ({ ...section, value: '' })),
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

export class DateFieldStore extends TemporalFieldStore<TemporalValue> {
  constructor(parameters: DateFieldStoreParameters) {
    const { adapter, direction, ...sharedParameters } = parameters;

    super(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? adapter.formats.localizedNumericDate,
      },
      adapter,
      config,
      direction,
      'DateField',
    );
  }

  public syncState(parameters: DateFieldStoreParameters) {
    const { adapter, direction, ...sharedParameters } = parameters;

    super.updateStateFromParameters(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? adapter.formats.localizedNumericDate,
      },
      adapter,
      config,
      direction,
    );
  }
}

export interface DateFieldStoreParameters extends MakeOptional<
  TemporalFieldStoreSharedParameters<TemporalValue>,
  'format'
> {
  adapter: TemporalAdapter;
  direction: TextDirection;
}
