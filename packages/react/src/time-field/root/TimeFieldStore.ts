import { TemporalAdapter, TemporalFieldDatePartType, TemporalValue } from '../../types';
import { TemporalFieldStore } from '../../utils/temporal/field/TemporalFieldStore';
import { ValidateTimeValidationProps } from '../../utils/temporal/validateTime';
import {
  TemporalFieldStoreSharedParameters,
  TemporalFieldConfiguration,
  TemporalFieldSection,
  TemporalFieldDatePartValueBoundaries,
  HiddenInputValidationProps,
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

const config: TemporalFieldConfiguration<TemporalValue, ValidateTimeValidationProps> = {
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
  stringifyValueForHiddenInput: (adapter, value, sections) => {
    const hasSeconds = hasSecondsInFormat(sections);
    return formatTimeForNativeInput(adapter, value, hasSeconds);
  },
  getAdjustmentBoundaries: (adapter, validationProps, datePart, structuralBoundaries) => {
    const { minTime, maxTime } = validationProps;
    if (!minTime && !maxTime) {
      return structuralBoundaries;
    }

    const validMinTime = minTime && adapter.isValid(minTime) ? minTime : null;
    const validMaxTime = maxTime && adapter.isValid(maxTime) ? maxTime : null;

    const result: TemporalFieldDatePartValueBoundaries = { ...structuralBoundaries };

    switch (datePart.token.config.part) {
      case 'hours': {
        if (validMinTime) {
          result.minimum = adapter.getHours(validMinTime);
        }
        if (validMaxTime) {
          result.maximum = adapter.getHours(validMaxTime);
        }
        return result;
      }

      case 'minutes': {
        // Only restrict minutes if min and max share the same hour
        const minHour = validMinTime ? adapter.getHours(validMinTime) : null;
        const maxHour = validMaxTime ? adapter.getHours(validMaxTime) : null;
        if (minHour !== null && maxHour !== null && minHour !== maxHour) {
          return structuralBoundaries;
        }
        if (validMinTime && (maxHour === null || minHour === maxHour)) {
          result.minimum = adapter.getMinutes(validMinTime);
        }
        if (validMaxTime && (minHour === null || minHour === maxHour)) {
          result.maximum = adapter.getMinutes(validMaxTime);
        }
        return result;
      }

      case 'seconds': {
        // Only restrict seconds if min and max share the same hour and minute
        const minH = validMinTime ? adapter.getHours(validMinTime) : null;
        const maxH = validMaxTime ? adapter.getHours(validMaxTime) : null;
        const minM = validMinTime ? adapter.getMinutes(validMinTime) : null;
        const maxM = validMaxTime ? adapter.getMinutes(validMaxTime) : null;
        if (minH !== null && maxH !== null && (minH !== maxH || minM !== maxM)) {
          return structuralBoundaries;
        }
        if (validMinTime && (maxH === null || (minH === maxH && minM === maxM))) {
          result.minimum = adapter.getSeconds(validMinTime);
        }
        if (validMaxTime && (minH === null || (minH === maxH && minM === maxM))) {
          result.maximum = adapter.getSeconds(validMaxTime);
        }
        return result;
      }

      case 'meridiem': {
        // Restrict meridiem if both min and max are in the same AM/PM half
        if (validMinTime && validMaxTime) {
          const minIsPM = adapter.getHours(validMinTime) >= 12;
          const maxIsPM = adapter.getHours(validMaxTime) >= 12;
          if (minIsPM && maxIsPM) {
            return { minimum: 1, maximum: 1 };
          }
          if (!minIsPM && !maxIsPM) {
            return { minimum: 0, maximum: 0 };
          }
        }
        return structuralBoundaries;
      }

      default:
        return structuralBoundaries;
    }
  },
  stringifyValidationPropsForHiddenInput: (adapter, validationProps, parsedFormat, step) => {
    // Use parsedFormat.granularity to determine step multiplier
    const multiplier = STEP_MULTIPLIERS[parsedFormat.granularity] ?? 60;
    const nativeStep = step * multiplier;

    const result: HiddenInputValidationProps = {
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

export class TimeFieldStore extends TemporalFieldStore<TemporalValue, ValidateTimeValidationProps> {
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
    MakeOptional<TemporalFieldStoreSharedParameters<TemporalValue>, 'format'>,
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
