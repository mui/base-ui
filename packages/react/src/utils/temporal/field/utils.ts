import { TextDirection } from '../../../direction-provider';
import {
  TemporalAdapter,
  TemporalFieldSectionType,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import { getMonthsInYear } from '../date-helpers';
import { TemporalManager } from '../types';
import {
  TemporalFieldParsedFormat,
  TemporalFieldSection,
  TemporalFieldSectionValueBoundaries,
  TemporalFieldStoreParameters,
  TemporalFieldToken,
  TemporalFieldConfiguration,
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
  parameters: TemporalFieldStoreParameters<TValue, TError>,
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
    format: parameters.format,
    disabled: parameters.disabled ?? false,
    readOnly: parameters.readOnly ?? false,
    timezoneProp: parameters.timezone,
    placeholderGetters: parameters.placeholderGetters,
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

export function getLetterEditingOptions(
  adapter: TemporalAdapter,
  timezone: TemporalTimezone,
  sectionType: TemporalFieldSectionType,
  format: string,
) {
  switch (sectionType) {
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

export function cleanDigitSectionValue(
  adapter: TemporalAdapter,
  value: number,
  sectionBoundaries: TemporalFieldSectionValueBoundaries<any>,
  localizedDigits: string[],
  token: Pick<TemporalFieldToken, 'tokenValue' | 'config' | 'isPadded'>,
) {
  if (process.env.NODE_ENV !== 'production') {
    if (token.config.sectionType !== 'day' && token.config.contentType === 'digit-with-letter') {
      throw new Error(
        [
          `Base UI: The token "${token.tokenValue}" is a digit format with letter in it.'
             This type of format is only supported for 'day' sections`,
        ].join('\n'),
      );
    }
  }

  if (token.config.sectionType === 'day' && token.config.contentType === 'digit-with-letter') {
    const date = adapter.setDate(
      (sectionBoundaries as TemporalFieldSectionValueBoundaries<'day'>).longestMonth,
      value,
    );
    return adapter.formatByString(date, token.tokenValue);
  }

  // queryValue without leading `0` (`01` => `1`)
  let valueStr = value.toString();

  if (token.isPadded) {
    valueStr = cleanLeadingZeros(valueStr, token.config.maxLength!);
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
  return parsedFormat.tokens.map((token, index) => ({
    token,
    value: adapter.isValid(date) ? adapter.formatByString(date, token.tokenValue) : '',
    modified: false,
    index,
  }));
}
