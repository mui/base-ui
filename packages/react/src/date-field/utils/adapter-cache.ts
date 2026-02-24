import { TemporalAdapter, TemporalSupportedObject, TemporalTimezone } from '../../types';
import { TemporalFieldDatePart } from './types';

/**
 * Cache for locale-dependent computations that are shared across all field instances using the same adapter.
 * Uses a WeakMap keyed by adapter instance, so entries are garbage-collected when the adapter is no longer referenced.
 */
interface TemporalAdapterFieldCache {
  weekDay?:
    | {
        /**
         * Formatted weekday strings keyed by format token (e.g., 'EEE' → ['Sun', 'Mon', ...])
         */
        strMap: Map<string, string[]>;
      }
    | undefined;
  meridiem?:
    | {
        /**
         * Formatted meridiem strings keyed by format token (e.g., 'a' → ['AM', 'PM'])
         */
        strMap: Map<string, string[]>;
      }
    | undefined;
  month?:
    | {
        /**
         * Formatted month strings keyed by format token (e.g., 'MMM' → ['Jan', 'Feb', ...])
         */
        strMap: Map<string, string[]>;
        /**
         * Date objects for each month in the year (from January to December).
         * The year and timezone are arbitrary, only the month value can be used reliably.
         */
        objects: TemporalSupportedObject[];
        /**
         * The month with the most days in the current year.
         */
        longestMonth: TemporalSupportedObject;
      }
    | undefined;
  year?:
    | {
        /**
         * Year format metadata keyed by format token (e.g., 'yyyy' → { length: 4 })
         */
        formatMap: Map<string, { length: number }>;
      }
    | undefined;
  /**
   * Localized digit mappings for the adapter's locale, or `null` if digits are standard ASCII ('0'-'9').
   * `undefined` means not yet computed.
   */
  localizedDigits?: LocalizedDigits | null | undefined;
  /**
   * Cached aria-valuetext results keyed by `tokenValue\0sectionValue\0timezone`.
   * For a given adapter (locale), the mapping from (token, value, timezone) to aria text is immutable.
   */
  ariaValueText?: Map<string, string | undefined> | undefined;
  /**
   * Cached regular expressions derived from the adapter's format token map.
   * These are used by FormatParser.parse() to tokenize format strings.
   */
  formatTokenRegExps?: FormatTokenRegExps | undefined;
  /**
   * An arbitrary date used for locale-dependent computations where the actual date value doesn't matter.
   * This is cached to avoid repeated `adapter.now('default')` calls when only invariant information is needed
   * (e.g., number of months in a year, days in a week, hour boundaries, etc.).
   * The actual date and timezone of this value should NOT be relied upon - only use it for format/locale queries.
   */
  arbitraryDate?: TemporalSupportedObject | undefined;
}

const adapterCache = new WeakMap<TemporalAdapter, TemporalAdapterFieldCache>();

function getAdapterFieldCache(adapter: TemporalAdapter): TemporalAdapterFieldCache {
  let cache = adapterCache.get(adapter);
  if (!cache) {
    cache = {};
    adapterCache.set(adapter, cache);
  }
  return cache;
}

/**
 * Returns a cached arbitrary date for the given adapter.
 * This date is used for locale-dependent computations where the actual date value doesn't matter.
 *
 * IMPORTANT: Do NOT rely on the actual date or timezone of this value.
 * Only use it for invariant queries like:
 * - Number of months in a year
 * - Number of days in a week
 * - Hour/minute/second boundaries
 * - Format string analysis
 * - Localized digit detection
 */
export function getArbitraryDate(adapter: TemporalAdapter): TemporalSupportedObject {
  const cache = getAdapterFieldCache(adapter);
  if (cache.arbitraryDate == null) {
    cache.arbitraryDate = adapter.now('default');
  }
  return cache.arbitraryDate;
}

function getMonthCache(adapter: TemporalAdapter) {
  const cache = getAdapterFieldCache(adapter);
  if (cache.month == null) {
    const firstMonth = adapter.startOfYear(getArbitraryDate(adapter));
    const monthsInYear = [firstMonth];
    let longestMonth = firstMonth;
    let daysInLongestMonth = adapter.getDaysInMonth(firstMonth);

    while (monthsInYear.length < 12) {
      const prevMonth = monthsInYear[monthsInYear.length - 1];
      const month = adapter.addMonths(prevMonth, 1);
      const daysInMonth = adapter.getDaysInMonth(month);
      monthsInYear.push(month);
      if (daysInMonth > daysInLongestMonth) {
        longestMonth = month;
        daysInLongestMonth = daysInMonth;
      }
    }

    cache.month = {
      strMap: new Map<string, string[]>(),
      objects: monthsInYear,
      longestMonth,
    };
  }

  return cache.month;
}

function getMeridiemCache(adapter: TemporalAdapter) {
  const cache = getAdapterFieldCache(adapter);
  if (cache.meridiem == null) {
    cache.meridiem = {
      strMap: new Map<string, string[]>(),
    };
  }
  return cache.meridiem;
}

function getWeekDayCache(adapter: TemporalAdapter) {
  const cache = getAdapterFieldCache(adapter);
  if (cache.weekDay == null) {
    cache.weekDay = {
      strMap: new Map<string, string[]>(),
    };
  }
  return cache.weekDay;
}

/**
 * Returns an array of formatted weekday strings for all days in a week.
 * Uses the adapter's locale to determine the start of the week and format the day names.
 *
 * ```ts
 * getWeekDaysStr(adapter, 'EEE');
 * // Returns: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] (for US locale)
 * // Returns: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] (for most European locales)
 * ```
 */
export function getWeekDaysStr(adapter: TemporalAdapter, format: string) {
  const weekDayCache = getWeekDayCache(adapter);
  const cached = weekDayCache.strMap.get(format);
  if (cached) {
    return cached;
  }

  const elements: TemporalSupportedObject[] = [];

  const arbitraryDate = getArbitraryDate(adapter);
  const startDate = adapter.startOfWeek(arbitraryDate);

  for (let i = 0; i < 7; i += 1) {
    elements.push(adapter.addDays(startDate, i));
  }

  const result = elements.map((weekDay) => adapter.formatByString(weekDay, format));
  weekDayCache.strMap.set(format, result);
  return result;
}

/**
 * Returns an array of formatted month strings for all months in a year.
 * Uses the adapter's locale to format the month names.
 *
 * ```ts
 * getMonthsStr(adapter, 'MMM');
 * // Returns: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
 * ```
 */
export function getMonthsStr(adapter: TemporalAdapter, format: string) {
  const monthCache = getMonthCache(adapter);
  const cached = monthCache.strMap.get(format);
  if (cached) {
    return cached;
  }

  const result = monthCache.objects!.map((month) => adapter.formatByString(month, format));
  monthCache.strMap.set(format, result);
  return result;
}

/**
 * Returns an array of formatted meridiem strings (e.g., AM/PM).
 * Uses the adapter's locale to format the meridiem names.
 *
 * ```ts
 * getMeridiemsStr(adapter, 'a');
 * // Returns: ['AM', 'PM']
 * ```
 */
export function getMeridiemsStr(adapter: TemporalAdapter, format: string) {
  const meridiemCache = getMeridiemCache(adapter);
  const cached = meridiemCache.strMap.get(format);
  if (cached) {
    return cached;
  }

  const arbitraryDate = getArbitraryDate(adapter);
  const result = [adapter.startOfDay(arbitraryDate), adapter.endOfDay(arbitraryDate)].map((date) =>
    adapter.formatByString(date, format),
  );
  meridiemCache.strMap.set(format, result);
  return result;
}

function getYearCache(adapter: TemporalAdapter) {
  const cache = getAdapterFieldCache(adapter);
  if (cache.year == null) {
    cache.year = {
      formatMap: new Map<string, { length: number }>(),
    };
  }
  return cache.year;
}

/**
 * Returns the length of a formatted year for the given format token.
 * This is used to determine if a year format produces a 2-digit or 4-digit year.
 *
 * ```ts
 * getYearFormatLength(adapter, 'yyyy'); // 4
 * getYearFormatLength(adapter, 'yy'); // 2
 * ```
 */
export function getYearFormatLength(adapter: TemporalAdapter, format: string): number {
  const yearCache = getYearCache(adapter);
  const cached = yearCache.formatMap.get(format);
  if (cached) {
    return cached.length;
  }

  const length = adapter.formatByString(getArbitraryDate(adapter), format).length;
  yearCache.formatMap.set(format, { length });
  return length;
}

export function getLongestMonthInCurrentYear(adapter: TemporalAdapter) {
  return getMonthCache(adapter).longestMonth;
}

/**
 * Bidirectional mapping between ASCII digits ('0'-'9') and their localized representations.
 * When the locale uses standard ASCII digits, `getLocalizedDigits` returns `null` instead.
 */
export interface LocalizedDigits {
  /** Maps ASCII digit char ('0'-'9') to localized string. E.g., '5' → '٥' */
  toLocalized: Map<string, string>;
  /** Maps localized digit string to ASCII digit char. E.g., '٥' → '5' */
  fromLocalized: Map<string, string>;
}

// This format should be the same on all the adapters.
// If some adapter does not respect this convention, then we will need to hardcode the format on each adapter.
const FORMAT_SECONDS_NO_LEADING_ZEROS = 's';

/**
 * Returns localized digit mappings for the adapter's locale.
 * Returns `null` when the locale uses standard ASCII digits ('0'-'9'), meaning no localization is needed.
 *
 * ```ts
 * getLocalizedDigits(adapter);
 * // Returns: null (for most locales — standard ASCII digits)
 * // Returns: { toLocalized: Map{'0' → '٠', ...}, fromLocalized: Map{'٠' → '0', ...} } (for Arabic locale)
 * ```
 */
export function getLocalizedDigits(adapter: TemporalAdapter): LocalizedDigits | null {
  const cache = getAdapterFieldCache(adapter);
  if (cache.localizedDigits === undefined) {
    const arbitraryDate = getArbitraryDate(adapter);
    const formattedZero = adapter.formatByString(
      adapter.setSeconds(arbitraryDate, 0),
      FORMAT_SECONDS_NO_LEADING_ZEROS,
    );

    if (formattedZero === '0') {
      cache.localizedDigits = null;
    } else {
      const toLocalized = new Map<string, string>();
      const fromLocalized = new Map<string, string>();
      for (let i = 0; i < 10; i += 1) {
        const localized = adapter.formatByString(
          adapter.setSeconds(arbitraryDate, i),
          FORMAT_SECONDS_NO_LEADING_ZEROS,
        );
        toLocalized.set(i.toString(), localized);
        fromLocalized.set(localized, i.toString());
      }
      cache.localizedDigits = { toLocalized, fromLocalized };
    }
  }

  return cache.localizedDigits;
}

/**
 * Returns the aria-valuetext for a date part section, with caching.
 * For a given adapter (locale), the result is deterministic based on the token format,
 * section value, and timezone — so it's safe to cache indefinitely per adapter instance.
 */
export function getAriaValueText(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
  timezone: TemporalTimezone,
): string | undefined {
  if (section.value === '') {
    return undefined;
  }

  const cache = getAdapterFieldCache(adapter);
  if (cache.ariaValueText == null) {
    cache.ariaValueText = new Map();
  }

  const key = `${section.token.value}\0${section.value}\0${timezone}`;
  const cached = cache.ariaValueText.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Check if the key exists with an `undefined` value (explicit cache of `undefined` result)
  if (cache.ariaValueText.has(key)) {
    return undefined;
  }

  const result = computeAriaValueText(adapter, section, timezone);
  cache.ariaValueText.set(key, result);
  return result;
}

export interface FormatTokenRegExps {
  /** RegExp that matches a word composed entirely of valid tokens. */
  regExpWordOnlyComposedOfTokens: RegExp;
  /** RegExp that matches the first valid token at the start of a word. */
  regExpFirstTokenInWord: RegExp;
}

/**
 * Returns cached regular expressions derived from the adapter's format token map.
 * These regexps are used by FormatParser to tokenize format strings and depend only
 * on the adapter's `formatTokenConfigMap`, which is stable per adapter instance.
 */
export function getFormatTokenRegExps(adapter: TemporalAdapter): FormatTokenRegExps {
  const cache = getAdapterFieldCache(adapter);
  if (cache.formatTokenRegExps == null) {
    const validTokens = Object.keys(adapter.formatTokenConfigMap).sort(
      (a, b) => b.length - a.length,
    );
    const tokenPattern = validTokens.join('|');
    cache.formatTokenRegExps = {
      regExpWordOnlyComposedOfTokens: new RegExp(`^(${tokenPattern})*$`),
      regExpFirstTokenInWord: new RegExp(`^(${tokenPattern})`),
    };
  }
  return cache.formatTokenRegExps;
}

function computeAriaValueText(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
  timezone: TemporalTimezone,
): string | undefined {
  const arbitraryDate = getArbitraryDate(adapter);
  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'digit') {
        const dateWithMonth = adapter.setMonth(
          adapter.startOfYear(arbitraryDate),
          Number(section.value) - 1,
        );
        return adapter.isValid(dateWithMonth)
          ? adapter.format(dateWithMonth, 'monthFullLetter')
          : '';
      }
      const parsedDate = adapter.parse(section.value, section.token.value, timezone);
      return parsedDate && adapter.isValid(parsedDate)
        ? adapter.format(parsedDate, 'monthFullLetter')
        : undefined;
    }
    case 'day':
      if (section.token.config.contentType === 'digit') {
        const dateWithDay = adapter.setDate(
          getLongestMonthInCurrentYear(adapter),
          Number(section.value),
        );
        return adapter.isValid(dateWithDay)
          ? adapter.format(dateWithDay, 'dayOfMonthWithLetter')
          : '';
      }
      return section.value;
    case 'weekDay': {
      const startOfWeekDate = adapter.startOfWeek(arbitraryDate);
      if (section.token.config.contentType === 'digit') {
        const dateWithWeekDay = adapter.addDays(startOfWeekDate, Number(section.value) - 1);
        return adapter.isValid(dateWithWeekDay) ? adapter.format(dateWithWeekDay, 'weekday') : '';
      }
      const formattedDaysInWeek = getWeekDaysStr(adapter, section.token.value);
      const index = formattedDaysInWeek.indexOf(section.value);
      if (index < 0) {
        return undefined;
      }
      const dateWithWeekDay = adapter.addDays(startOfWeekDate, index);
      return adapter.isValid(dateWithWeekDay)
        ? adapter.format(dateWithWeekDay, 'weekday')
        : undefined;
    }
    default:
      return undefined;
  }
}
