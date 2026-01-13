import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import {
  ValidateDateReturnValue,
  ValidateDateValidationProps,
} from '../../utils/temporal/validateDate';
import {
  TemporalFieldStoreParameters,
  TemporalFieldValueManager,
} from '../../utils/temporal/field/types';
import { areDatesEqual } from '../../utils/temporal/date-helpers';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getDateManager } from '../../utils/temporal/getDateManager';
import { TextDirection } from '../../direction-provider';

const valueManager: TemporalFieldValueManager<TemporalValue> = {
  emptyValue: null,
  areValuesEqual: areDatesEqual,
  getSectionsFromValue: (date, getSectionsFromDate) => getSectionsFromDate(date),
  getDateFromSection: (value) => value,
  getDateSectionsFromValue: (sections) => sections,
  updateDateInValue: (value, activeSection, activeDate) => activeDate,
  parseValueStr: (valueStr, referenceValue, parseDate) =>
    parseDate(valueStr.trim(), referenceValue),
  getInitialReferenceValue: ({ value, ...other }) =>
    getInitialReferenceDate({ ...other, externalDate: value }),
  clearDateSections: (sections) => sections.map((section) => ({ ...section, value: '' })),
};

export class DateFieldStore extends TemporalFieldStore<
  TemporalValue,
  ValidateDateValidationProps,
  ValidateDateReturnValue
> {
  constructor(
    parameters: DateFieldStoreParameters,
    adapter: TemporalAdapter,
    direction: TextDirection,
  ) {
    const manager = getDateManager(adapter);
    const { minDate, maxDate, ...sharedParameters } = parameters;

    super(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? adapter.formats.localizedNumericDate,
      },
      { minDate, maxDate },
      adapter,
      manager,
      valueManager,
      direction,
    );
  }
}

export interface DateFieldStoreParameters
  extends
    MakeOptional<TemporalFieldStoreParameters<TemporalValue, ValidateDateReturnValue>, 'format'>,
    ValidateDateValidationProps {}

/**
 * Makes specified keys in a type optional.
 *
 * @template T - The original type.
 * @template K - The keys to make optional.
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
