import {
  TemporalTimezone,
  TemporalSupportedObject,
  TemporalSectionType,
  TemporalSectionContentType,
} from './temporal';

export interface TemporalAdapterFormats {
  /**
   * The 4-digit year.
   * @example "2019"
   */
  year: string;
  /**
   * The month with leading zeros.
   * @example "08"
   */
  monthLeadingZeros: string;
  /**
   * The day of the month with leading zeros.
   * @example "01"
   */
  dayOfMonth: string;
  /**
   * The day of the month without leading zeros.
   * @example "1"
   */
  dayOfMonthNoLeadingZeros: string;
  /**
   * The name of the day of the week.
   * @example "Wednesday"
   */
  weekday: string;
  /**
   * The abbreviated name of the day of the week.
   * @example "Wed"
   * */
  weekday3Letters: string;
  /**
   * The hours with leading zeros, 24-hour clock.
   * @example "01", "23"
   */
  hours24hLeadingZeros: string;
  /**
   * The hours with leading zeros, 12-hour clock.
   * @example "01", "11"
   */
  hours12hLeadingZeros: string;
  /**
   * The meridiem.
   * @example "AM"
   */
  meridiem: string;
  /**
   * The minutes with leading zeros.
   * @example "01", "59"
   */
  minutesLeadingZeros: string;
  /**
   * The seconds with leading zeros.
   * @example "01", "59"
   */
  secondsLeadingZeros: string;
}

export type TemporalTokenMap = {
  [formatToken: string]: {
    sectionType: TemporalSectionType;
    contentType: TemporalSectionContentType;
    maxLength?: number;
  };
};

// https://www.zhenghao.io/posts/ts-never#how-to-check-for-never
type PropertyIfNotNever<PName extends string, PType> = [PType] extends [never]
  ? {}
  : { [P in PName]?: PType };

export type TemporalAdapterParameters<TLocale, TInstance> = {
  formats?: Partial<TemporalAdapterFormats>;
  locale?: TLocale;
} & PropertyIfNotNever<'instance', TInstance>;

export type DateBuilderReturnType<T extends string | null | undefined> = [T] extends [null]
  ? null
  : TemporalSupportedObject;

export interface TemporalAdapter<TLocale = any> {
  isTimezoneCompatible: boolean;
  formats: TemporalAdapterFormats;
  locale?: TLocale;
  /**
   * Name of the library that is used right now
   */
  lib: string;
  /**
   * Characters used to escape a string inside a format.
   */
  escapedCharacters: { start: string; end: string };
  /**
   * Map containing all the format that the field components can understand.
   */
  formatTokenMap: TemporalTokenMap;
  /**
   * Creates a date in the date library format.
   * If no `value` parameter is provided, creates a date with the current timestamp.
   * If a `value` parameter is provided, pass it to the date library to try to parse it.
   */
  date<T extends string | null | undefined>(
    value?: T,
    timezone?: TemporalTimezone,
  ): DateBuilderReturnType<T>;
  /**
   * Extracts the timezone from a date.
   */
  getTimezone(value: TemporalSupportedObject | null): TemporalTimezone;
  /**
   * Converts a date to another timezone.
   */
  setTimezone(value: TemporalSupportedObject, timezone: TemporalTimezone): TemporalSupportedObject;
  /**
   * Converts a date in the library format into a JavaScript `Date` object.
   */
  toJsDate(value: TemporalSupportedObject): Date;
  /**
   * Parses a string date in a specific format.
   */
  parse(value: string, format: string): TemporalSupportedObject | null;
  /**
   * Gets the code of the locale currently used by the adapter.
   */
  getCurrentLocaleCode(): string;
  /**
   * Checks if the current locale is using 12 hours cycle (i.e: time with meridiem).
   */
  is12HourCycleInCurrentLocale(): boolean;
  /**
   * Creates a format with no meta-token (for example: `LLL` or `PP`).
   */
  expandFormat(format: string): string;
  /**
   * Checks if the date is valid.
   */
  isValid(value: TemporalSupportedObject | null): value is TemporalSupportedObject;
  /**
   * Formats a date using an adapter format string (see the `AdapterFormats` interface)
   */
  format(value: TemporalSupportedObject, formatKey: keyof TemporalAdapterFormats): string;
  /**
   * Formats a date using a format of the date library.
   */
  formatByString(value: TemporalSupportedObject, formatString: string): string;
  /**
   * Formats a number to be rendered in the clock.
   * Is being used in hijri and jalali adapters.
   */
  formatNumber(numberToFormat: string): string;
  /**
   * Checks if the two dates are equal (which means they represent the same timestamp).
   */
  isEqual(
    value: TemporalSupportedObject | null,
    comparing: TemporalSupportedObject | null,
  ): boolean;
  /**
   * Checks if the two dates are in the same year (using the timezone of the reference date).
   */
  isSameYear(value: TemporalSupportedObject, comparing: TemporalSupportedObject): boolean;
  /**
   * Check sif the two dates are in the same month (using the timezone of the reference date).
   */
  isSameMonth(value: TemporalSupportedObject, comparing: TemporalSupportedObject): boolean;
  /**
   * Checks if the two dates are in the same day (using the timezone of the reference date).
   */
  isSameDay(value: TemporalSupportedObject, comparing: TemporalSupportedObject): boolean;
  /**
   * Checks if the two dates are at the same hour (using the timezone of the reference date).
   */
  isSameHour(value: TemporalSupportedObject, comparing: TemporalSupportedObject): boolean;
  /**
   * Checks if the reference date is after the second date.
   * If the unit is 'day' or 'year', it will compare the dates only by the day or year part.
   */
  isAfter(
    value: TemporalSupportedObject,
    comparing: TemporalSupportedObject,
    unit?: 'day' | 'year' | null,
  ): boolean;
  /**
   * Checks if the reference date is before the second date.
   * If the unit is 'day' or 'year', it will compare the dates only by the day or year part.
   */
  isBefore(
    value: TemporalSupportedObject,
    comparing: TemporalSupportedObject,
    unit?: 'day' | 'year' | null,
  ): boolean;
  /**
   * Checks if the value is within the provided range.
   */
  isWithinRange(
    value: TemporalSupportedObject,
    range: [TemporalSupportedObject, TemporalSupportedObject],
  ): boolean;
  /**
   * Returns the start of the year for the given date.
   */
  startOfYear(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the start of the month for the given date.
   */
  startOfMonth(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the start of the week for the given date.
   */
  startOfWeek(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the start of the day for the given date.
   */
  startOfDay(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the start of the hour for the given date.
   */
  startOfHour(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the start of the minute for the given date.
   */
  startOfMinute(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the start of the second for the given date.
   */
  startOfSecond(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the year for the given date.
   */
  endOfYear(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the month for the given date.
   */
  endOfMonth(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the week for the given date.
   */
  endOfWeek(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the day for the given date.
   */
  endOfDay(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the hour for the given date.
   */
  endOfHour(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the minute for the given date.
   */
  endOfMinute(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Returns the end of the second for the given date.
   */
  endOfSecond(value: TemporalSupportedObject): TemporalSupportedObject;
  /**
   * Adds the specified number of years to the given date.
   */
  addYears(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Adds the specified number of months to the given date.
   */
  addMonths(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Adds the specified number of weeks to the given date.
   */
  addWeeks(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Adds the specified number of days to the given date.
   */
  addDays(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Adds the specified number of hours to the given date.
   */
  addHours(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Adds the specified number of minutes to the given date.
   */
  addMinutes(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Adds the specified number of seconds to the given date.
   */
  addSeconds(value: TemporalSupportedObject, amount: number): TemporalSupportedObject;
  /**
   * Gets the year of the given date.
   */
  getYear(value: TemporalSupportedObject): number;
  /**
   * Gets the month of the given date.
   * The value is 0-based, in the Gregorian calendar January = 0, February = 1, ...
   */
  getMonth(value: TemporalSupportedObject): number;
  /**
   * Gets the date (day in the month) of the given date.
   */
  getDate(value: TemporalSupportedObject): number;
  /**
   * Gets the hours of the given date.
   */
  getHours(value: TemporalSupportedObject): number;
  /**
   * Gets the minutes of the given date.
   */
  getMinutes(value: TemporalSupportedObject): number;
  /**
   * Gets the seconds of the given date.
   */
  getSeconds(value: TemporalSupportedObject): number;
  /**
   * Gets the milliseconds of the given date.
   */
  getMilliseconds(value: TemporalSupportedObject): number;
  /**
   * Sets the year to the given date.
   */
  setYear(value: TemporalSupportedObject, year: number): TemporalSupportedObject;
  /**
   * Sets the month to the given date.
   */
  setMonth(value: TemporalSupportedObject, month: number): TemporalSupportedObject;
  /**
   * Sets the date (day in the month) to the given date.
   */
  setDate(value: TemporalSupportedObject, date: number): TemporalSupportedObject;
  /**
   * Sets the hours to the given date.
   */
  setHours(value: TemporalSupportedObject, hours: number): TemporalSupportedObject;
  /**
   * Sets the minutes to the given date.
   */
  setMinutes(value: TemporalSupportedObject, minutes: number): TemporalSupportedObject;
  /**
   * Sets the seconds to the given date.
   */
  setSeconds(value: TemporalSupportedObject, seconds: number): TemporalSupportedObject;
  /**
   * Sets the milliseconds to the given date.
   */
  setMilliseconds(value: TemporalSupportedObject, milliseconds: number): TemporalSupportedObject;
  /**
   * Gets the number of days in a month of the given date.
   */
  getDaysInMonth(value: TemporalSupportedObject): number;
  /**
   * Creates a nested list with all the days of the month of the given date grouped by week.
   */
  getWeekArray(value: TemporalSupportedObject): TemporalSupportedObject[][];
  /**
   * Gets the number of the week of the given date.
   */
  getWeekNumber(value: TemporalSupportedObject): number;
  /**
   * Gets the number of the day of the week of the given date.
   * The value is 1-based, 1 - first day of the week, 7 - last day of the week.
   */
  getDayOfWeek(value: TemporalSupportedObject): number;
  /**
   * Creates a list with all the years between the start and the end date.
   */
  getYearRange(
    range: [TemporalSupportedObject, TemporalSupportedObject],
  ): TemporalSupportedObject[];
}
