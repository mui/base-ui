import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import {
  ValidateDateReturnValue,
  ValidateDateValidationProps,
} from '../../utils/temporal/validateDate';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
  TemporalFieldDatePartValueBoundaries,
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
  nativeInputType: 'date',
  stringifyValueForNativeInput: (adapter, value, _sections) =>
    formatDateForNativeInput(adapter, value),
  getAdjustmentBoundaries: (adapter, validationProps, datePart, structuralBoundaries) => {
    const { minDate, maxDate } = validationProps;
    if (!minDate && !maxDate) {
      return structuralBoundaries;
    }

    const validMinDate = minDate && adapter.isValid(minDate) ? minDate : null;
    const validMaxDate = maxDate && adapter.isValid(maxDate) ? maxDate : null;

    const result: TemporalFieldDatePartValueBoundaries = { ...structuralBoundaries };

    switch (datePart.token.config.part) {
      case 'year': {
        if (validMinDate) {
          result.minimum = adapter.getYear(validMinDate);
        }
        if (validMaxDate) {
          result.maximum = adapter.getYear(validMaxDate);
        }
        return result;
      }

      case 'month': {
        // Only restrict month if min and max share the same year
        if (validMinDate && validMaxDate && !adapter.isSameYear(validMinDate, validMaxDate)) {
          return structuralBoundaries;
        }
        if (validMinDate && (!validMaxDate || adapter.isSameYear(validMinDate, validMaxDate))) {
          result.minimum = adapter.getMonth(validMinDate) + 1;
        }
        if (validMaxDate && (!validMinDate || adapter.isSameYear(validMinDate, validMaxDate))) {
          result.maximum = adapter.getMonth(validMaxDate) + 1;
        }
        return result;
      }

      case 'day': {
        // Only restrict day if min and max share the same year and month
        if (validMinDate && validMaxDate && !adapter.isSameMonth(validMinDate, validMaxDate)) {
          return structuralBoundaries;
        }
        if (validMinDate && (!validMaxDate || adapter.isSameMonth(validMinDate, validMaxDate))) {
          result.minimum = adapter.getDate(validMinDate);
        }
        if (validMaxDate && (!validMinDate || adapter.isSameMonth(validMinDate, validMaxDate))) {
          result.maximum = adapter.getDate(validMaxDate);
        }
        return result;
      }

      default:
        return structuralBoundaries;
    }
  },
  stringifyValidationPropsForNativeInput: (adapter, validationProps) => {
    // Date inputs don't use step attribute
    const result: { min?: string; max?: string } = {};
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
