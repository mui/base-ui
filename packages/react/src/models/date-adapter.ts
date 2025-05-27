import { DateTimezone, DateSupportedShape, DateSectionType, DateSectionContentType } from './date';

export interface DateAdapterFormats {
  // Token formats
  /**
   * The 4-digit year.
   * @example "2019"
   */
  year: string;
  /**
   * The full month name.
   * @example "January"
   */
  month: string;
  /**
   * The abbreviated month name.
   * @example "Jan"
   */
  monthShort: string;
  /**
   * The day of the month.
   * @example "1"
   */
  dayOfMonth: string;
  /**
   * The day of the month with letters.
   * @example "2nd"
   */
  dayOfMonthFull: string;
  /**
   * The name of the day of the week.
   * @example "Wednesday"
   */
  weekday: string;
  /**
   * The abbreviated name of the day of the week.
   * @example "Wed"
   * */
  weekdayShort: string;
  /**
   * The hours, 24-hour clock.
   * @example "23"
   */
  hours24h: string;
  /**
   * The hours, 12-hour clock.
   * @example "11"
   */
  hours12h: string;
  /**
   * The meridiem.
   * @example "AM"
   */
  meridiem: string;
  /**
   * The minutes.
   * @example "44"
   */
  minutes: string;
  /**
   * The seconds.
   * @example "00"
   */
  seconds: string;

  // Date formats
  /** The localized full date.
   * @example "Jan 1, 2019"
   */
  fullDate: string;
  /**
   * A keyboard input friendly date format.
   * Used in the date fields.
   * @example "02/13/2020"
   */
  keyboardDate: string;
  /**
   * The abbreviated month name and the day of the month.
   * @example "Jan 1"
   */
  shortDate: string;
  /**
   * The month name and the day of the month.
   * @example "1 January"
   */
  normalDate: string;
  /**
   * The month name, the day of the week and the day of the month.
   * @example "Sun, Jan 1"
   */
  normalDateWithWeekday: string;

  // Time formats
  /**
   * The hours with the meridiem and minutes.
   * @example "11:44 PM"
   */
  fullTime12h: string;
  /**
   * The hours without the meridiem and minutes.
   * @example "23:44"
   */
  fullTime24h: string;

  // Date & Time formats
  /**
   * A keyboard input friendly time format for 12-hour clock.
   * Used in the date-time fields.
   * @example "02/13/2020 11:44 PM"
   */
  keyboardDateTime12h: string;
  /**
   * A keyboard input friendly time format for 24-hour clock.
   * Used in the date-time fields.
   * @example "02/13/2020 23:44"
   */
  keyboardDateTime24h: string;
}

export type DateTokenMap = {
  [formatToken: string]:
    | DateSectionType
    | {
        sectionType: DateSectionType;
        contentType: DateSectionContentType;
        maxLength?: number;
      };
};

// https://www.zhenghao.io/posts/ts-never#how-to-check-for-never
type PropertyIfNotNever<PName extends string, PType> = [PType] extends [never]
  ? {}
  : { [P in PName]?: PType };

export type DateAdapterOptions<TLocale, TInstance> = {
  formats?: Partial<DateAdapterFormats>;
  locale?: TLocale;
} & PropertyIfNotNever<'instance', TInstance>;

export type DateBuilderReturnType<T extends string | null | undefined> = [T] extends [null]
  ? null
  : DateSupportedShape;

export interface DateAdapter<TLocale = any> {
  isTimezoneCompatible: boolean;
  formats: DateAdapterFormats;
  locale?: TLocale;
  /**
   * Name of the library that is used right now
   */
  lib: string;
  /**
   * The characters used to escape a string inside a format.
   */
  escapedCharacters: { start: string; end: string };
  /**
   * A map containing all the format that the field components can understand.
   */
  formatTokenMap: DateTokenMap;
  /**
   * Create a date in the date library format.
   * If no `value` parameter is provided, creates a date with the current timestamp.
   * If a `value` parameter is provided, pass it to the date library to try to parse it.
   * @param {string | null | undefined} value The optional value to parse.
   * @param {DateTimezone} timezone The timezone of the date. Default: "default"
   * @returns {DateSupportedShape | null} The parsed date.
   */
  date<T extends string | null | undefined>(
    value?: T,
    timezone?: DateTimezone,
  ): DateBuilderReturnType<T>;
  /**
   * Extracts the timezone from a date.
   * @param {DateSupportedShape | null} value The date from which we want to get the timezone.
   * @returns {DateSupportedShape} The timezone of the date.
   */
  getTimezone(value: DateSupportedShape | null): DateTimezone;
  /**
   * Convert a date to another timezone.
   * @param {DateSupportedShape} value The date to convert.
   * @param {DateTimezone} timezone The timezone to convert the date to.
   * @returns {DateSupportedShape} The converted date.
   */
  setTimezone(value: DateSupportedShape, timezone: DateTimezone): DateSupportedShape;
  /**
   * Convert a date in the library format into a JavaScript `Date` object.
   * @param {DateSupportedShape} value The value to convert.
   * @returns {DateSupportedShape} the JavaScript date.
   */
  toJsDate(value: DateSupportedShape): Date;
  /**
   * Parse a string date in a specific format.
   * @param {string} value The string date to parse.
   * @param {string} format The format in which the string date is.
   * @returns {DateSupportedShape | null} The parsed date.
   */
  parse(value: string, format: string): DateSupportedShape | null;
  /**
   * Get the code of the locale currently used by the adapter.
   * @returns {string} The code of the locale.
   */
  getCurrentLocaleCode(): string;
  /**
   * Check if the current locale is using 12 hours cycle (i.e: time with meridiem).
   * @returns {boolean} `true` if the current locale is using 12 hours cycle.
   */
  is12HourCycleInCurrentLocale(): boolean;
  /**
   * Create a format with no meta-token (for example: `LLL` or `PP`).
   * @param {string} format The format to expand.
   * @returns {string} The expanded format.
   */
  expandFormat(format: string): string;
  /**
   * Check if the date is valid.
   * @param {DateSupportedShape | null} value The value to test.
   * @returns {boolean} `true` if the value is a valid date according to the date library.
   */
  isValid(value: DateSupportedShape | null): value is DateSupportedShape;
  /**
   * Format a date using an adapter format string (see the `AdapterFormats` interface)
   * @param {DateSupportedShape} value The date to format.
   * @param {keyof DateAdapterFormats} formatKey The formatKey to use.
   * @returns {string} The stringify date.
   */
  format(value: DateSupportedShape, formatKey: keyof DateAdapterFormats): string;
  /**
   * Format a date using a format of the date library.
   * @param {DateSupportedShape} value The date to format.
   * @param {string} formatString The format to use.
   * @returns {string} The stringify date.
   */
  formatByString(value: DateSupportedShape, formatString: string): string;
  /**
   * Format a number to be rendered in the clock.
   * Is being used in hijri and jalali adapters.
   * @param {string} numberToFormat The number to format.
   * @returns {string} The formatted number.
   */
  formatNumber(numberToFormat: string): string;
  /**
   * Check if the two dates are equal (which means they represent the same timestamp).
   * @param {DateSupportedShape | null} value The reference date.
   * @param {DateSupportedShape | null} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the two dates are equal.
   */
  isEqual(value: DateSupportedShape | null, comparing: DateSupportedShape | null): boolean;
  /**
   * Check if the two dates are in the same year (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the two dates are in the same year.
   */
  isSameYear(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  /**
   * Check if the two dates are in the same month (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the two dates are in the same month.
   */
  isSameMonth(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  /**
   * Check if the two dates are in the same day (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the two dates are in the same day.
   */
  isSameDay(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  /**
   * Check if the two dates are at the same hour (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the two dates are in the same hour.
   */
  isSameHour(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  /**
   * Check if the reference date is after the second date.
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the reference date is after the second date.
   */
  isAfter(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  // TODO v7: Consider adding a `unit` param to `isAfter` and drop this method.
  /**
   * Check if the year of the reference date is after the year of the second date (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the year of the reference date is after the year of the second date.
   */
  isAfterYear(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  // TODO v7: Consider adding a `unit` param to `isAfter` and drop this method.
  /**
   * Check if the day of the reference date is after the day of the second date (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the day of the reference date is after the day of the second date.
   */
  isAfterDay(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  /**
   * Check if the reference date is before the second date.
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the reference date is before the second date.
   */
  isBefore(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  // TODO v7: Consider adding a `unit` param to `isBefore` and drop this method.
  /**
   * Check if the year of the reference date is before the year of the second date (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the year of the reference date is before the year of the second date.
   */
  isBeforeYear(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  // TODO v7: Consider adding a `unit` param to `isBefore` and drop this method.
  /**
   * Check if the day of the reference date is before the day of the second date (using the timezone of the reference date).
   * @param {DateSupportedShape} value The reference date.
   * @param {DateSupportedShape} comparing The date to compare with the reference date.
   * @returns {boolean} `true` if the day of the reference date is before the day of the second date.
   */
  isBeforeDay(value: DateSupportedShape, comparing: DateSupportedShape): boolean;
  /**
   * Check if the value is within the provided range.
   * @param {DateSupportedShape} value The value to test.
   * @param {[DateSupportedShape, DateSupportedShape]} range The range in which the value should be.
   * @returns {boolean} `true` if the value is within the provided range.
   */
  isWithinRange(
    value: DateSupportedShape,
    range: [DateSupportedShape, DateSupportedShape],
  ): boolean;
  /**
   * Return the start of the year for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The start of the year of the given date.
   */
  startOfYear(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the start of the month for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The start of the month of the given date.
   */
  startOfMonth(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the start of the week for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The start of the week of the given date.
   */
  startOfWeek(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the start of the day for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The start of the day of the given date.
   */
  startOfDay(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the end of the year for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The end of the year of the given date.
   */
  endOfYear(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the end of the month for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The end of the month of the given date.
   */
  endOfMonth(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the end of the week for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The end of the week of the given date.
   */
  endOfWeek(value: DateSupportedShape): DateSupportedShape;
  /**
   * Return the end of the day for the given date.
   * @param {DateSupportedShape} value The original date.
   * @returns {DateSupportedShape} The end of the day of the given date.
   */
  endOfDay(value: DateSupportedShape): DateSupportedShape;
  /**
   * Add the specified number of years to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of years to be added.
   * @returns {DateSupportedShape} The new date with the years added.
   */
  addYears(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Add the specified number of months to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of months to be added.
   * @returns {DateSupportedShape} The new date with the months added.
   */
  addMonths(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Add the specified number of weeks to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of weeks to be added.
   * @returns {DateSupportedShape} The new date with the weeks added.
   */
  addWeeks(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Add the specified number of days to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of days to be added.
   * @returns {DateSupportedShape} The new date with the days added.
   */
  addDays(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Add the specified number of hours to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of hours to be added.
   * @returns {DateSupportedShape} The new date with the hours added.
   */
  addHours(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Add the specified number of minutes to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of minutes to be added.
   * @returns {DateSupportedShape} The new date with the minutes added.
   */
  addMinutes(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Add the specified number of seconds to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} amount The amount of seconds to be added.
   * @returns {DateSupportedShape} The new date with the seconds added.
   */
  addSeconds(value: DateSupportedShape, amount: number): DateSupportedShape;
  /**
   * Get the year of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The year of the given date.
   */
  getYear(value: DateSupportedShape): number;
  /**
   * Get the month of the given date.
   * The value is 0-based, in the Gregorian calendar January = 0, February = 1, ...
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The month of the given date.
   */
  getMonth(value: DateSupportedShape): number;
  /**
   * Get the date (day in the month) of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The date of the given date.
   */
  getDate(value: DateSupportedShape): number;
  /**
   * Get the hours of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The hours of the given date.
   */
  getHours(value: DateSupportedShape): number;
  /**
   * Get the minutes of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The minutes of the given date.
   */
  getMinutes(value: DateSupportedShape): number;
  /**
   * Get the seconds of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The seconds of the given date.
   */
  getSeconds(value: DateSupportedShape): number;
  /**
   * Get the milliseconds of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The milliseconds of the given date.
   */
  getMilliseconds(value: DateSupportedShape): number;
  /**
   * Set the year to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} year The year of the new date.
   * @returns {DateSupportedShape} The new date with the year set.
   */
  setYear(value: DateSupportedShape, year: number): DateSupportedShape;
  /**
   * Set the month to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} month The month of the new date.
   * @returns {DateSupportedShape} The new date with the month set.
   */
  setMonth(value: DateSupportedShape, month: number): DateSupportedShape;
  /**
   * Set the date (day in the month) to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} date The date of the new date.
   * @returns {DateSupportedShape} The new date with the date set.
   */
  setDate(value: DateSupportedShape, date: number): DateSupportedShape;
  /**
   * Set the hours to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} hours The hours of the new date.
   * @returns {DateSupportedShape} The new date with the hours set.
   */
  setHours(value: DateSupportedShape, hours: number): DateSupportedShape;
  /**
   * Set the minutes to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} minutes The minutes of the new date.
   * @returns {DateSupportedShape} The new date with the minutes set.
   */
  setMinutes(value: DateSupportedShape, minutes: number): DateSupportedShape;
  /**
   * Set the seconds to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} seconds The seconds of the new date.
   * @returns {DateSupportedShape} The new date with the seconds set.
   */
  setSeconds(value: DateSupportedShape, seconds: number): DateSupportedShape;
  /**
   * Set the milliseconds to the given date.
   * @param {DateSupportedShape} value The date to be changed.
   * @param {number} milliseconds The milliseconds of the new date.
   * @returns {DateSupportedShape} The new date with the milliseconds set.
   */
  setMilliseconds(value: DateSupportedShape, milliseconds: number): DateSupportedShape;
  /**
   * Get the number of days in a month of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The number of days in the month
   */
  getDaysInMonth(value: DateSupportedShape): number;
  /**
   * Create a nested list with all the days of the month of the given date grouped by week.
   * @param {DateSupportedShape} value The given date.
   * @returns {DateSupportedShape[][]} A nested list with all the days of the month grouped by week.
   */
  getWeekArray(value: DateSupportedShape): DateSupportedShape[][];
  /**
   * Get the number of the week of the given date.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The number of the week of the given date.
   */
  getWeekNumber(value: DateSupportedShape): number;
  /**
   * Get the number of the day of the week of the given date.
   * The value is 1-based, 1 - first day of the week, 7 - last day of the week.
   * @param {DateSupportedShape} value The given date.
   * @returns {number} The number of the day of the week of the given date.
   */
  getDayOfWeek(value: DateSupportedShape): number;
  /**
   * Create a list with all the years between the start and the end date.
   * @param {[DateSupportedShape, DateSupportedShape]} range The range of year to create.
   * @returns {DateSupportedShape[]} List of all the years between the start end the end date.
   */
  getYearRange(range: [DateSupportedShape, DateSupportedShape]): DateSupportedShape[];
}
