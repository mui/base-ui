import { TextDirection } from '../../../direction-provider';
import {
  TemporalAdapter,
  TemporalFieldDatePartType,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import { TemporalManager } from '../types';
import {
  getLongestMonthInCurrentYear,
  getMeridiemsStr,
  getMonthsStr,
  getWeekDaysStr,
} from './adapter-cache';
import {
  AdjustDatePartValueKeyCode,
  TemporalFieldQueryApplier,
  TemporalFieldParsedFormat,
  TemporalFieldSection,
  TemporalFieldStoreSharedParameters,
  TemporalFieldToken,
  TemporalFieldConfiguration,
  TemporalFieldSeparator,
  TemporalFieldDatePart,
} from './types';

/**
 * Ordering of date part types by granularity (from least to most granular).
 * Used for determining the most granular part in a format.
 */
export const DATE_PART_GRANULARITY: Record<string, number> = {
  year: 1,
  month: 2,
  day: 3,
  weekDay: 4,
  meridiem: 5,
  hours: 6,
  minutes: 7,
  seconds: 8,
};

/**
 * Ordering of date part types by granularity (from least to most granular).
 * Used for ordering section modifications during date merging.
 */
export const DATE_PART_TRANSFER_PRIORITY: Record<string, number> = {
  year: 1,
  month: 2,
  day: 3,
  weekDay: 4,
  hours: 5,
  minutes: 6,
  seconds: 7,
  meridiem: 8,
};

/**
 * Returns the properties of the state that are derived from the parameters.
 * This do not contain state properties that don't update whenever the parameters update.
 */
export function deriveStateFromParameters<TValue extends TemporalSupportedValue>(
  parameters: TemporalFieldStoreSharedParameters<TValue>,
  adapter: TemporalAdapter,
  config: TemporalFieldConfiguration<TValue>,
  direction: TextDirection,
) {
  return {
    minDate: parameters.minDate,
    maxDate: parameters.maxDate,
    direction,
    config,
    adapter,
    referenceDateProp: parameters.referenceDate ?? null,
    valueProp: parameters.value,
    format: parameters.format,
    required: parameters.required ?? false,
    disabledProp: parameters.disabled ?? false,
    readOnly: parameters.readOnly ?? false,
    nameProp: parameters.name,
    id: parameters.id,
    timezoneProp: parameters.timezone,
    placeholderGetters: parameters.placeholderGetters,
    fieldContext: parameters.fieldContext ?? null,
    step: parameters.step ?? 1,
    children: parameters.children,
  };
}

export function applyLocalizedDigits(valueStr: string, localizedDigits: string[]) {
  if (localizedDigits[0] === '0') {
    return valueStr;
  }

  return valueStr
    .split('')
    .map((char) => localizedDigits[Number(char)])
    .join('');
}

/**
 * Normalizes a digit string to have the correct amount of leading zeros for the given size.
 * E.g.: `3` with size 2 => `03`, `007` with size 2 => `07`
 * Warning: Should only be called with non-localized digits. Call `removeLocalizedDigits` with your value if needed.
 */
export function normalizeLeadingZeros(valueStr: string, size: number) {
  // Remove the leading zeros and then add back as many as needed.
  return Number(valueStr).toString().padStart(size, '0');
}

export function removeLocalizedDigits(valueStr: string, localizedDigits: string[]) {
  if (localizedDigits[0] === '0') {
    return valueStr;
  }

  const digits: string[] = [];
  let currentFormattedDigit = '';
  for (let i = 0; i < valueStr.length; i += 1) {
    currentFormattedDigit += valueStr[i];
    const matchingDigitIndex = localizedDigits.indexOf(currentFormattedDigit);
    if (matchingDigitIndex > -1) {
      digits.push(matchingDigitIndex.toString());
      currentFormattedDigit = '';
    }
  }

  return digits.join('');
}

export function getTimezoneToRender<TValue extends TemporalSupportedValue>(
  adapter: TemporalAdapter,
  manager: TemporalManager<TValue, any, any>,
  value: TValue,
  referenceDateProp: TemporalSupportedObject | null | undefined,
  timezoneProp: TemporalTimezone | null | undefined,
) {
  if (timezoneProp != null) {
    return timezoneProp;
  }

  const valueTimezone = manager.getTimezone(value);
  if (valueTimezone) {
    return valueTimezone;
  }

  if (referenceDateProp) {
    return adapter.getTimezone(referenceDateProp);
  }
  return 'default';
}

/**
 * Returns an array of valid letter-based editing options for a given section type.
 */
export function getLetterEditingOptions(
  adapter: TemporalAdapter,
  type: TemporalFieldDatePartType,
  format: string,
) {
  switch (type) {
    case 'month': {
      return getMonthsStr(adapter, format);
    }

    case 'weekDay': {
      return getWeekDaysStr(adapter, format);
    }

    case 'meridiem': {
      return getMeridiemsStr(adapter, format);
    }

    default: {
      return [];
    }
  }
}

/**
 * Formats a numeric value for display in a digit-based field section.
 * Handles padding with leading zeros, localization of digits, and special digit-with-letter day formats (e.g., '1st', '2nd').
 *
 * ```ts
 * // Padded month: 5 → '05'
 * cleanDigitDatePartValue(adapter, 5, ['0', '1', ...], {
 *   value: 'MM', config: { part: 'month', contentType: 'digit' }, isPadded: true, maxLength: 2
 * });
 *
 * // Arabic numerals: 5 → '٥'
 * cleanDigitDatePartValue(adapter, 5, ['٠', '١', '٢', '٣', '٤', '٥', ...], {
 *   value: 'M', config: { part: 'month', contentType: 'digit' }, isPadded: false, maxLength: undefined
 * });
 * ```
 */
export function cleanDigitDatePartValue(
  adapter: TemporalAdapter,
  value: number,
  localizedDigits: string[],
  token: TemporalFieldToken,
) {
  if (token.config.contentType === 'digit-with-letter') {
    if (process.env.NODE_ENV !== 'production') {
      if (token.config.part !== 'day') {
        throw new Error(
          [
            `Base UI: The token "${token.value}" is a digit format with letter in it.'
             This type of format is only supported for 'day' sections`,
          ].join('\n'),
        );
      }
    }

    // Special case for day with letter (1st, 2nd, 3rd, 4th, etc.)
    const date = adapter.setDate(getLongestMonthInCurrentYear(adapter), value);
    return adapter.formatByString(date, token.value);
  }

  // queryValue without leading `0` (`01` => `1`)
  let valueStr = value.toString();

  if (token.isPadded) {
    valueStr = normalizeLeadingZeros(valueStr, token.maxLength!);
  }

  return applyLocalizedDigits(valueStr, localizedDigits);
}

export function isStringNumber(valueStr: string, localizedDigits: string[]) {
  const nonLocalizedValueStr = removeLocalizedDigits(valueStr, localizedDigits);
  // `Number(' ')` returns `0` even if ' ' is not a valid number.
  return nonLocalizedValueStr !== ' ' && !Number.isNaN(Number(nonLocalizedValueStr));
}

export function buildSections(
  adapter: TemporalAdapter,
  parsedFormat: TemporalFieldParsedFormat,
  date: TemporalSupportedObject | null,
): TemporalFieldSection[] {
  return parsedFormat.elements.map((element, index) => {
    if (isToken(element)) {
      return {
        type: 'datePart' as const,
        token: element,
        value: adapter.isValid(date) ? adapter.formatByString(date, element.value) : '',
        modified: false,
        index,
      };
    }

    return {
      ...element,
      index,
    };
  });
}

export function isToken(
  element: TemporalFieldToken | TemporalFieldSeparator,
): element is TemporalFieldToken {
  return element.type === 'token';
}

export function isDatePart(section: TemporalFieldSection): section is TemporalFieldDatePart {
  return section.type === 'datePart';
}

export function isSeparator(
  element: TemporalFieldToken | TemporalFieldSection,
): element is TemporalFieldSeparator {
  return element.type === 'separator';
}

export function mergeDateIntoReferenceDate(
  sourceDate: TemporalSupportedObject,
  sections: TemporalFieldSection[],
  referenceDate: TemporalSupportedObject,
  shouldLimitToEditedSections: boolean,
): TemporalSupportedObject {
  const dateParts = sections
    .filter(isDatePart)
    .sort(
      (a, b) =>
        DATE_PART_TRANSFER_PRIORITY[a.token.config.part] -
        DATE_PART_TRANSFER_PRIORITY[b.token.config.part],
    );

  let targetDate = referenceDate;
  for (const datePart of dateParts) {
    if (!shouldLimitToEditedSections || datePart.modified) {
      targetDate = datePart.token.transferValue(sourceDate, targetDate, datePart);
    }
  }
  return targetDate;
}

export function isQueryResponseWithoutValue(
  response: ReturnType<TemporalFieldQueryApplier>,
): response is { saveQuery: boolean } {
  return (response as { saveQuery: boolean }).saveQuery != null;
}

export function getAdjustmentDelta(
  keyCode: AdjustDatePartValueKeyCode,
  currentValue: string,
): number | 'boundary' {
  const isStart = keyCode === 'Home';
  const isEnd = keyCode === 'End';

  if (currentValue === '' || isStart || isEnd) {
    return 'boundary';
  }

  switch (keyCode) {
    case 'ArrowUp':
      return 1;
    case 'ArrowDown':
      return -1;
    case 'PageUp':
      return 5;
    case 'PageDown':
      return -5;
    default:
      return 'boundary';
  }
}

export function getDirection(keyCode: AdjustDatePartValueKeyCode): 'up' | 'down' {
  return keyCode === 'ArrowUp' || keyCode === 'PageUp' || keyCode === 'Home' ? 'up' : 'down';
}

export function isIncrementDirection(keyCode: AdjustDatePartValueKeyCode): boolean {
  return keyCode === 'ArrowUp' || keyCode === 'PageUp';
}

export function isDecrementDirection(keyCode: AdjustDatePartValueKeyCode): boolean {
  return keyCode === 'ArrowDown' || keyCode === 'PageDown';
}

/**
 * Wraps a value within [min, max] bounds, cycling around when exceeding limits.
 * E.g., wrapInRange(32, 1, 31) => 1, wrapInRange(0, 1, 31) => 31
 */
export function wrapInRange(value: number, min: number, max: number): number {
  const range = max - min + 1;
  if (value > max) {
    return min + ((value - max - 1) % range);
  }
  if (value < min) {
    return max - ((min - value - 1) % range);
  }
  return value;
}

/**
 * Aligns a value to the nearest step boundary in the given direction.
 * - 'up' rounds down (e.g., alignToStep(22, 5, 'up') => 20)
 * - 'down' rounds up (e.g., alignToStep(22, 5, 'down') => 25)
 */
export function alignToStep(value: number, stepVal: number, direction: 'up' | 'down'): number {
  if (value % stepVal === 0) {
    return value;
  }
  if (direction === 'down') {
    // For JS: -3 % 5 = -3 (should be 2), so we use (step + value) % step
    return value + stepVal - ((stepVal + value) % stepVal);
  }
  return value - (value % stepVal);
}
