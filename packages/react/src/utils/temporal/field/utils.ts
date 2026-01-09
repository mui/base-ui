import { TextDirection } from '../../../direction-provider';
import {
  TemporalAdapter,
  TemporalFieldSectionContentType,
  TemporalFieldSectionType,
  TemporalFormatTokenConfig,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import { getMonthsInYear } from '../date-helpers';
import { TemporalManager } from '../types';
import {
  TemporalFieldParsedFormat,
  TemporalFieldSectionValueBoundaries,
  TemporalFieldStoreParameters,
  TemporalFieldToken,
  TemporalFieldValueManager,
} from './types';

/**
 * Returns the properties of the state that are derived from the parameters.
 * This do not contain state properties that don't update whenever the parameters update.
 */
export function deriveStateFromParameters<
  TValue extends TemporalSupportedValue,
  TValidationProps extends object,
  TError,
>(
  parameters: TemporalFieldStoreParameters<TValue, TError>,
  validationProps: TValidationProps,
  adapter: TemporalAdapter,
  manager: TemporalManager<TValue, TError, any>,
  valueManager: TemporalFieldValueManager<TValue>,
  direction: TextDirection,
) {
  return {
    validationProps,
    direction,
    valueManager,
    adapter,
    manager,
    referenceDateProp: parameters.referenceDate ?? null,
    format: parameters.format,
    disabled: parameters.disabled ?? false,
    readOnly: parameters.readOnly ?? false,
    timezoneProp: parameters.timezone,
    placeholderGetters: parameters.placeholderGetters,
  };
}

export function getFormatTokenConfig(
  adapter: TemporalAdapter,
  formatToken: string,
): TemporalFormatTokenConfig {
  const config = adapter.formatTokenConfigMap[formatToken];

  if (config == null) {
    throw new Error(
      [
        `MUI X: The token "${formatToken}" is not supported by the Base UI components.`,
        'Please try using another token or open an issue on https://github.com/mui/base-ui/issues/new/choose if you think it should be supported.',
      ].join('\n'),
    );
  }

  return config;
}

export function doesSectionFormatHaveLeadingZeros(
  adapter: TemporalAdapter,
  contentType: TemporalFieldSectionContentType,
  sectionType: TemporalFieldSectionType,
  format: string,
) {
  if (contentType !== 'digit') {
    return false;
  }

  const now = adapter.now('default');

  switch (sectionType) {
    // We can't use `changeSectionValueFormat`, because  `adapter.parse('1', 'YYYY')` returns `1971` instead of `1`.
    case 'year': {
      // Remove once https://github.com/iamkun/dayjs/pull/2847 is merged and bump dayjs version
      if (adapter.lib === 'dayjs' && format === 'YY') {
        return true;
      }
      return adapter.formatByString(adapter.setYear(now, 1), format).startsWith('0');
    }

    case 'month': {
      return adapter.formatByString(adapter.startOfYear(now), format).length > 1;
    }

    case 'day': {
      return adapter.formatByString(adapter.startOfMonth(now), format).length > 1;
    }

    case 'weekDay': {
      return adapter.formatByString(adapter.startOfWeek(now), format).length > 1;
    }

    case 'hours': {
      return adapter.formatByString(adapter.setHours(now, 1), format).length > 1;
    }

    case 'minutes': {
      return adapter.formatByString(adapter.setMinutes(now, 1), format).length > 1;
    }

    case 'seconds': {
      return adapter.formatByString(adapter.setSeconds(now, 1), format).length > 1;
    }

    default: {
      throw new Error('Invalid section type');
    }
  }
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

// This format should be the same on all the adapters
// If some adapter does not respect this convention, then we will need to hardcode the format on each adapter.
export const FORMAT_SECONDS_NO_LEADING_ZEROS = 's';

const NON_LOCALIZED_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function getLocalizedDigits(adapter: TemporalAdapter) {
  const today = adapter.now('default');
  const formattedZero = adapter.formatByString(
    adapter.setSeconds(today, 0),
    FORMAT_SECONDS_NO_LEADING_ZEROS,
  );

  if (formattedZero === '0') {
    return NON_LOCALIZED_DIGITS;
  }

  return Array.from({ length: 10 }).map((_, index) =>
    adapter.formatByString(adapter.setSeconds(today, index), FORMAT_SECONDS_NO_LEADING_ZEROS),
  );
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
) {
  return parsedFormat.tokens.map((token) => ({
    token,
    value: adapter.isValid(date) ? adapter.formatByString(date, token.tokenValue) : '',
    modified: false,
  }));
}
