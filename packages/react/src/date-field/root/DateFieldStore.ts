import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import { ValidateDateValidationProps } from '../../utils/temporal/validateDate';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
  HiddenInputValidationProps,
} from '../../utils/temporal/field/types';
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
  const year = adapter.format(value, 'yearPadded');
  const month = adapter.format(value, 'monthPadded');
  const day = adapter.format(value, 'dayOfMonthPadded');
  return `${year}-${month}-${day}`;
}

const config: TemporalFieldConfiguration<TemporalValue, ValidateDateValidationProps> = {
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
  stringifyValueForHiddenInput: (adapter, value, _sections) =>
    formatDateForNativeInput(adapter, value),
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

export class DateFieldStore extends TemporalFieldStore<TemporalValue, ValidateDateValidationProps> {
  constructor(parameters: DateFieldStoreParameters) {
    const { validationProps, adapter, direction, ...sharedParameters } = parameters;

    super(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? adapter.formats.localizedNumericDate,
      },
      validationProps,
      adapter,
      config,
      direction,
      'DateField',
    );
  }

  public syncState(parameters: DateFieldStoreParameters) {
    const { validationProps, adapter, direction, ...sharedParameters } = parameters;

    super.updateStateFromParameters(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? adapter.formats.localizedNumericDate,
      },
      validationProps,
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
  validationProps: ValidateDateValidationProps;
  adapter: TemporalAdapter;
  direction: TextDirection;
}
