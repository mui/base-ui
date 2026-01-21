import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import {
  ValidateTimeReturnValue,
  ValidateTimeValidationProps,
} from '../../utils/temporal/validateTime';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
} from '../../utils/temporal/field/types';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getTimeManager } from '../../utils/temporal/getTimeManager';
import { TextDirection } from '../../direction-provider';
import { MakeOptional } from '../../utils/types';

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
  stringifyValue: (adapter, value) =>
    adapter.isValid(value) ? adapter.toJsDate(value).toISOString() : '',
};

export class TimeFieldStore extends TemporalFieldStore<
  TemporalValue,
  ValidateTimeReturnValue,
  ValidateTimeValidationProps
> {
  constructor(parameters: TimeFieldStoreParameters) {
    const { validationProps, adapter, direction, ampm, ...sharedParameters } = parameters;

    super(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? TimeFieldStore.getDefaultFormat(adapter, ampm),
      },
      validationProps,
      adapter,
      config,
      direction,
      'TimeField',
    );
  }

  public syncState(parameters: TimeFieldStoreParameters) {
    const { validationProps, adapter, direction, ampm, ...sharedParameters } = parameters;

    super.updateStateFromParameters(
      {
        ...sharedParameters,
        format: sharedParameters.format ?? TimeFieldStore.getDefaultFormat(adapter, ampm),
      },
      validationProps,
      adapter,
      config,
      direction,
    );
  }

  private static getDefaultFormat(adapter: TemporalAdapter, ampm: boolean | undefined) {
    const ampmWithDefault = ampm ?? adapter.is12HourCycleInCurrentLocale();
    const f = adapter.formats;
    return ampmWithDefault
      ? `${f.hours12hPadded}:${f.minutesPadded} ${f.meridiem}`
      : `${f.hours24hPadded}:${f.minutesPadded}`;
  }
}

interface TimeFieldStoreParameters
  extends
    MakeOptional<
      TemporalFieldStoreSharedParameters<TemporalValue, ValidateTimeReturnValue>,
      'format'
    >,
    AmPmParameters {
  validationProps: ValidateTimeValidationProps;
  adapter: TemporalAdapter;
  direction: TextDirection;
}

export interface AmPmParameters {
  /**
   * Whether to use 12-hour format with AM/PM or 24-hour format.
   * @default based on the current locale
   */
  ampm?: boolean | undefined;
}
