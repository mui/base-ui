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
import { TemporalDateType, TemporalManager } from '../types';
import {
  TemporalFieldNonRangeSection,
  TemporalFieldPlaceholderGetters,
  TemporalFieldSection,
  TemporalFieldSectionValueBoundaries,
} from './types';

export function getDateSectionConfigFromFormatToken(
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

let warnedOnceInvalidSection = false;

export function validateSections<TValue extends TemporalSupportedValue>(
  sections: TemporalFieldSection<TValue>[],
  dateType: TemporalDateType,
) {
  if (process.env.NODE_ENV !== 'production') {
    if (!warnedOnceInvalidSection) {
      const supportedSections: TemporalFieldSectionType[] = ['empty'];
      if (['date', 'date-time'].includes(dateType)) {
        supportedSections.push('weekDay', 'day', 'month', 'year');
      }
      if (['time', 'date-time'].includes(dateType)) {
        supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
      }

      const invalidSection = sections.find(
        (section) => !supportedSections.includes(section.sectionType),
      );

      if (invalidSection) {
        console.warn(
          `MUI X: The field component you are using is not compatible with the "${invalidSection.sectionType}" date section.`,
          `The supported date sections are ["${supportedSections.join('", "')}"]\`.`,
        );
        warnedOnceInvalidSection = true;
      }
    }
  }
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
  section: Pick<
    TemporalFieldNonRangeSection,
    | 'format'
    | 'sectionType'
    | 'contentType'
    | 'hasLeadingZerosInFormat'
    | 'hasLeadingZerosInInput'
    | 'maxLength'
  >,
) {
  if (process.env.NODE_ENV !== 'production') {
    if (section.sectionType !== 'day' && section.contentType === 'digit-with-letter') {
      throw new Error(
        [
          `MUI X: The token "${section.format}" is a digit format with letter in it.'
             This type of format is only supported for 'day' sections`,
        ].join('\n'),
      );
    }
  }

  if (section.sectionType === 'day' && section.contentType === 'digit-with-letter') {
    const date = adapter.setDate(
      (sectionBoundaries as TemporalFieldSectionValueBoundaries<'day'>).longestMonth,
      value,
    );
    return adapter.formatByString(date, section.format);
  }

  // queryValue without leading `0` (`01` => `1`)
  let valueStr = value.toString();

  if (section.hasLeadingZerosInInput) {
    valueStr = cleanLeadingZeros(valueStr, section.maxLength!);
  }

  return applyLocalizedDigits(valueStr, localizedDigits);
}

export function isStringNumber(valueStr: string, localizedDigits: string[]) {
  const nonLocalizedValueStr = removeLocalizedDigits(valueStr, localizedDigits);
  // `Number(' ')` returns `0` even if ' ' is not a valid number.
  return nonLocalizedValueStr !== ' ' && !Number.isNaN(Number(nonLocalizedValueStr));
}

export function getSectionVisibleValue(
  section: TemporalFieldNonRangeSection,
  target: 'input-rtl' | 'input-ltr' | 'non-input',
  localizedDigits: string[],
) {
  let value = section.value || section.placeholder;

  const hasLeadingZeros =
    target === 'non-input' ? section.hasLeadingZerosInFormat : section.hasLeadingZerosInInput;

  if (
    target === 'non-input' &&
    section.hasLeadingZerosInInput &&
    !section.hasLeadingZerosInFormat
  ) {
    value = Number(removeLocalizedDigits(value, localizedDigits)).toString();
  }

  // In the input, we add an empty character at the end of each section without leading zeros.
  // This makes sure that `onChange` will always be fired.
  // Otherwise, when your input value equals `1/dd/yyyy` (format `M/DD/YYYY` on DayJs),
  // If you press `1`, on the first section, the new value is also `1/dd/yyyy`,
  // So the browser will not fire the input `onChange`.
  const shouldAddInvisibleSpace =
    ['input-rtl', 'input-ltr'].includes(target) &&
    section.contentType === 'digit' &&
    !hasLeadingZeros &&
    value.length === 1;

  if (shouldAddInvisibleSpace) {
    value = `${value}\u200e`;
  }

  if (target === 'input-rtl') {
    value = `\u2068${value}\u2069`;
  }

  return value;
}

/**
 * Some date libraries like `dayjs` don't support parsing from date with escaped characters.
 * To make sure that the parsing works, we are building a format and a date without any separator.
 */
export function getDateFromDateSections(
  adapter: TemporalAdapter,
  sections: TemporalFieldNonRangeSection[],
  localizedDigits: string[],
): TemporalSupportedObject {
  // If we have both a day and a weekDay section,
  // Then we skip the weekDay in the parsing because libraries like dayjs can't parse complicated formats containing a weekDay.
  // dayjs(dayjs().format('dddd MMMM D YYYY'), 'dddd MMMM D YYYY')) // returns `Invalid Date` even if the format is valid.
  const shouldSkipWeekDays = sections.some((section) => section.sectionType === 'day');

  const sectionFormats: string[] = [];
  const sectionValues: string[] = [];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];

    const shouldSkip = shouldSkipWeekDays && section.sectionType === 'weekDay';
    if (!shouldSkip) {
      sectionFormats.push(section.format);
      sectionValues.push(getSectionVisibleValue(section, 'non-input', localizedDigits));
    }
  }

  const formatWithoutSeparator = sectionFormats.join(' ');
  const dateWithoutSeparatorStr = sectionValues.join(' ');

  return adapter.parse(dateWithoutSeparatorStr, formatWithoutSeparator)!;
}

export const DEFAULT_PLACEHOLDER_GETTERS: TemporalFieldPlaceholderGetters = {
  year: (params) => 'Y'.repeat(params.digitAmount),
  month: (params) => (params.contentType === 'letter' ? 'MMMM' : 'MM'),
  day: () => 'DD',
  weekDay: (params) => (params.contentType === 'letter' ? 'EEEE' : 'EE'),
  hours: () => 'hh',
  minutes: () => 'mm',
  seconds: () => 'ss',
  meridiem: () => 'aa',
};
