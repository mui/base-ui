import { TextDirection } from '../../../direction-provider';
import {
  TemporalAdapter,
  TemporalFieldDatePartType,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import { getMonthsInYear } from '../date-helpers';
import { TemporalManager } from '../types';
import {
  TemporalFieldParsedFormat,
  TemporalFieldSection,
  TemporalFieldDatePartValueBoundaries,
  TemporalFieldStoreSharedParameters,
  TemporalFieldToken,
  TemporalFieldConfiguration,
  TemporalFieldSeparator,
  TemporalFieldDatePart,
} from './types';

/**
 * Returns the properties of the state that are derived from the parameters.
 * This do not contain state properties that don't update whenever the parameters update.
 */
export function deriveStateFromParameters<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends object,
>(
  parameters: TemporalFieldStoreSharedParameters<TValue, TError>,
  validationProps: TValidationProps,
  adapter: TemporalAdapter,
  config: TemporalFieldConfiguration<TValue, TError, TValidationProps>,
  direction: TextDirection,
) {
  return {
    validationProps,
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
 * Make sure the value of a digit section have the right amount of leading zeros.
 * E.g.: `03` => `3`
 * Warning: Should only be called with non-localized digits. Call `removeLocalizedDigits` with your value if needed.
 */
export function cleanLeadingZeros(valueStr: string, size: number) {
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

/**
 * Returns an array of formatted weekday strings for all days in a week.
 * Uses the adapter's locale to determine the start of the week and format the day names.
 *
 * ```ts
 * getDaysInWeekStr(adapter, 'EEE');
 * // Returns: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] (for US locale)
 * // Returns: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] (for most European locales)
 * ```
 */
export function getDaysInWeekStr(adapter: TemporalAdapter, format: string) {
  const elements: TemporalSupportedObject[] = [];

  const now = adapter.now('default');
  const startDate = adapter.startOfWeek(now);
  const endDate = adapter.endOfWeek(now);

  let current = startDate;
  while (adapter.isBefore(current, endDate)) {
    elements.push(current);
    current = adapter.addDays(current, 1);
  }

  return elements.map((weekDay) => adapter.formatByString(weekDay, format));
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
 * Used to provide autocomplete options when a user types letters into a field section.
 * Supports `'month'` (returns 12 months), `'weekDay'` (returns 7 weekdays), and `'meridiem'` (returns AM/PM).
 * Other section types return an empty array.
 *
 * ```ts
 * getLetterEditingOptions(adapter, 'default', 'month', 'MMM');
 * // Returns: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
 *
 * getLetterEditingOptions(adapter, 'default', 'weekDay', 'EEEE');
 * // Returns: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
 * ```
 */
export function getLetterEditingOptions(
  adapter: TemporalAdapter,
  timezone: TemporalTimezone,
  type: TemporalFieldDatePartType,
  format: string,
) {
  switch (type) {
    case 'month': {
      return getMonthsInYear(adapter, adapter.now(timezone)).map((month) =>
        adapter.formatByString(month, format!),
      );
    }

    case 'weekDay': {
      return getDaysInWeekStr(adapter, format);
    }

    case 'meridiem': {
      const now = adapter.now(timezone);
      return [adapter.startOfDay(now), adapter.endOfDay(now)].map((date) =>
        adapter.formatByString(date, format),
      );
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
 * cleanDigitDatePartValue(adapter, 5, boundaries, ['0', '1', ...], {
 *   value: 'MM', config: { part: 'month', contentType: 'digit' }, isPadded: true, maxLength: 2
 * });
 *
 * // Arabic numerals: 5 → '٥'
 * cleanDigitDatePartValue(adapter, 5, boundaries, ['٠', '١', '٢', '٣', '٤', '٥', ...], {
 *   value: 'M', config: { part: 'month', contentType: 'digit' }, isPadded: false, maxLength: undefined
 * });
 * ```
 */
export function cleanDigitDatePartValue(
  adapter: TemporalAdapter,
  value: number,
  boundaries: TemporalFieldDatePartValueBoundaries<any>,
  localizedDigits: string[],
  token: TemporalFieldToken,
) {
  if (process.env.NODE_ENV !== 'production') {
    if (token.config.part !== 'day' && token.config.contentType === 'digit-with-letter') {
      throw new Error(
        [
          `Base UI: The token "${token.value}" is a digit format with letter in it.'
             This type of format is only supported for 'day' sections`,
        ].join('\n'),
      );
    }
  }

  if (token.config.part === 'day' && token.config.contentType === 'digit-with-letter') {
    const date = adapter.setDate(
      (boundaries as TemporalFieldDatePartValueBoundaries<'day'>).longestMonth,
      value,
    );
    return adapter.formatByString(date, token.value);
  }

  // queryValue without leading `0` (`01` => `1`)
  let valueStr = value.toString();

  if (token.isPadded) {
    valueStr = cleanLeadingZeros(valueStr, token.maxLength!);
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
  return typeof (element as TemporalFieldToken).isPadded === 'boolean';
}

export function isDatePart(section: TemporalFieldSection): section is TemporalFieldDatePart {
  return (section as TemporalFieldDatePart).token !== undefined;
}

export function isSeparator(
  element: TemporalFieldSeparator | TemporalFieldToken | TemporalFieldSection,
) {
  return !isToken(element) && !isDatePart(element);
}
