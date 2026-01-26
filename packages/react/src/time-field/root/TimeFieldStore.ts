import { TemporalAdapter, TemporalFieldDatePartType, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import {
  ValidateTimeReturnValue,
  ValidateTimeValidationProps,
} from '../../utils/temporal/validateTime';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
  TemporalFieldSection,
} from '../../utils/temporal/field/types';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { getTimeManager } from '../../utils/temporal/getTimeManager';
import { TextDirection } from '../../direction-provider';
import { MakeOptional } from '../../utils/types';

/**
 * Checks if the format includes seconds by examining sections.
 */
function hasSecondsInFormat(sections: TemporalFieldSection[]): boolean {
  return sections.some((section) => 'token' in section && section.token.config.part === 'seconds');
}

/**
 * Formats a time value for native input.
 * @param hasSeconds - Whether to include seconds (based on format)
 * Returns '' for invalid/empty input to trigger valueMissing validation if required.
 */
function formatTimeForNativeInput(
  adapter: TemporalAdapter,
  value: TemporalValue,
  hasSeconds: boolean,
): string {
  if (!adapter.isValid(value)) {
    return '';
  }
  const hours = adapter.format(value, 'hours24hPadded');
  const minutes = adapter.format(value, 'minutesPadded');
  // Include seconds based on format, not the value
  if (hasSeconds) {
    return `${hours}:${minutes}:${adapter.format(value, 'secondsPadded')}`;
  }
  return `${hours}:${minutes}`;
}

/**
 * Formats a time value for min/max attributes.
 * Always includes seconds for rounding purposes.
 */
function formatTimeForMinMax(adapter: TemporalAdapter, value: TemporalValue): string {
  if (!adapter.isValid(value)) {
    return '';
  }
  const hours = adapter.format(value, 'hours24hPadded');
  const minutes = adapter.format(value, 'minutesPadded');
  const seconds = adapter.format(value, 'secondsPadded');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Multipliers to convert props.step to native input step (in seconds).
 */
const STEP_MULTIPLIERS: Partial<Record<TemporalFieldDatePartType, number>> = {
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

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
  nativeInputType: 'time',
  stringifyValueForNativeInput: (adapter, value, sections) => {
    const hasSeconds = hasSecondsInFormat(sections);
    return formatTimeForNativeInput(adapter, value, hasSeconds);
  },
  stringifyValidationPropsForNativeInput: (adapter, validationProps, parsedFormat, step) => {
    // Use parsedFormat.granularity to determine step multiplier
    const multiplier = STEP_MULTIPLIERS[parsedFormat.granularity] ?? 60;
    const nativeStep = step * multiplier;

    const result: { min?: string; max?: string; step?: string } = {
      step: String(nativeStep),
    };
    // Always include seconds in min/max for rounding purposes
    if (validationProps.minTime) {
      const formatted = formatTimeForMinMax(adapter, validationProps.minTime);
      if (formatted) {
        result.min = formatted;
      }
    }
    if (validationProps.maxTime) {
      const formatted = formatTimeForMinMax(adapter, validationProps.maxTime);
      if (formatted) {
        result.max = formatted;
      }
    }
    return result;
  },
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
