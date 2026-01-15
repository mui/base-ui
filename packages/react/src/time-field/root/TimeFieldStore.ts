import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import {
  ValidateTimeReturnValue,
  ValidateTimeValidationProps,
} from '../../utils/temporal/validateTime';
import {
  TemporalFieldStoreParameters,
  TemporalFieldConfiguration,
} from '../../utils/temporal/field/types';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getTimeManager } from '../../utils/temporal/getTimeManager';
import { TextDirection } from '../../direction-provider';

const config: TemporalFieldConfiguration<
  TemporalValue,
  ValidateTimeReturnValue,
  ValidateTimeValidationProps
> = {
  getManager: getTimeManager,
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
  stringifyValue: (adapter, value) => (value == null ? '' : adapter.toJsDate(value).toISOString()),
};

export class TimeFieldStore extends TemporalFieldStore<
  TemporalValue,
  ValidateTimeReturnValue,
  ValidateTimeValidationProps
> {
  constructor(
    parameters: TimeFieldStoreParameters,
    adapter: TemporalAdapter,
    direction: TextDirection,
  ) {
    const { minTime, maxTime, ...sharedParameters } = parameters;

    super(
      sharedParameters,
      { minTime, maxTime },
      adapter,
      config,
      direction,
      'TimeField',
    );
  }

  public tempUpdate(
    parameters: TimeFieldStoreParameters,
    adapter: TemporalAdapter,
    direction: TextDirection,
  ) {
    const { minTime, maxTime, ...sharedParameters } = parameters;

    super.updateStateFromParameters(
      sharedParameters,
      { minTime, maxTime },
      adapter,
      config,
      direction,
    );
  }
}

export interface TimeFieldStoreParameters
  extends TemporalFieldStoreParameters<TemporalValue, ValidateTimeReturnValue>,
    ValidateTimeValidationProps {}
