import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import {
  ValidateDateReturnValue,
  ValidateDateValidationProps,
} from '../../utils/temporal/validateDate';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
} from '../../utils/temporal/field/types';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getDateManager } from '../../utils/temporal/getDateManager';
import { TextDirection } from '../../direction-provider';
import { MakeOptional } from '../../utils/types';

const config: TemporalFieldConfiguration<
  TemporalValue,
  ValidateDateReturnValue,
  ValidateDateValidationProps
> = {
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
};

export class DateFieldStore extends TemporalFieldStore<
  TemporalValue,
  ValidateDateReturnValue,
  ValidateDateValidationProps
> {
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
  TemporalFieldStoreSharedParameters<TemporalValue, ValidateDateReturnValue>,
  'format'
> {
  validationProps: ValidateDateValidationProps;
  adapter: TemporalAdapter;
  direction: TextDirection;
}
