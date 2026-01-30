import { TemporalAdapter, TemporalSupportedObject } from '../../../types';

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
   *  The 10 digits (0–9) in the adapter's locale (e.g., ['0', '1', ...] or ['٠', '١', ...])
   */
  localizedDigits?: string[] | undefined;
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
 *
 * @param adapter The temporal adapter instance
 * @returns A cached date object for the adapter
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
  const endDate = adapter.endOfWeek(arbitraryDate);

  let current = startDate;
  while (adapter.isBefore(current, endDate)) {
    elements.push(current);
    current = adapter.addDays(current, 1);
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

// This format should be the same on all the adapters.
// If some adapter does not respect this convention, then we will need to hardcode the format on each adapter.
const FORMAT_SECONDS_NO_LEADING_ZEROS = 's';

const NON_LOCALIZED_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Returns the localized digits used by the adapter.
 * This is an array of 10 strings representing the digits 0 to 9 in the localized format.
 *
 * ```ts
 * getLocalizedDigits(adapter);
 * // Returns: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] (for most locales)
 * // Returns: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] (for Arabic locale)
 * ```
 */
export function getLocalizedDigits(adapter: TemporalAdapter): string[] {
  const cache = getAdapterFieldCache(adapter);
  if (cache.localizedDigits == null) {
    const arbitraryDate = getArbitraryDate(adapter);
    const formattedZero = adapter.formatByString(
      adapter.setSeconds(arbitraryDate, 0),
      FORMAT_SECONDS_NO_LEADING_ZEROS,
    );

    if (formattedZero === '0') {
      cache.localizedDigits = NON_LOCALIZED_DIGITS;
    } else {
      cache.localizedDigits = Array.from({ length: 10 }).map((_, index) =>
        adapter.formatByString(
          adapter.setSeconds(arbitraryDate, index),
          FORMAT_SECONDS_NO_LEADING_ZEROS,
        ),
      );
    }
  }

  return cache.localizedDigits;
}
