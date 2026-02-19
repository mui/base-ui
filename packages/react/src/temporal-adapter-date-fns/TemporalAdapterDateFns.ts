'use client';
import { addDays } from 'date-fns/addDays';
import { addHours } from 'date-fns/addHours';
import { addMinutes } from 'date-fns/addMinutes';
import { addMonths } from 'date-fns/addMonths';
import { addSeconds } from 'date-fns/addSeconds';
import { addMilliseconds } from 'date-fns/addMilliseconds';
import { addWeeks } from 'date-fns/addWeeks';
import { addYears } from 'date-fns/addYears';
import { differenceInDays } from 'date-fns/differenceInDays';
import { differenceInHours } from 'date-fns/differenceInHours';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { differenceInMonths } from 'date-fns/differenceInMonths';
import { differenceInWeeks } from 'date-fns/differenceInWeeks';
import { differenceInYears } from 'date-fns/differenceInYears';
import { endOfDay } from 'date-fns/endOfDay';
import { endOfHour } from 'date-fns/endOfHour';
import { endOfMinute } from 'date-fns/endOfMinute';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfSecond } from 'date-fns/endOfSecond';
import { endOfWeek } from 'date-fns/endOfWeek';
import { endOfYear } from 'date-fns/endOfYear';
import { format as dateFnsFormat } from 'date-fns/format';
import { getDate } from 'date-fns/getDate';
import { getDay } from 'date-fns/getDay';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';
import { getHours } from 'date-fns/getHours';
import { getMilliseconds } from 'date-fns/getMilliseconds';
import { getMinutes } from 'date-fns/getMinutes';
import { getMonth } from 'date-fns/getMonth';
import { getSeconds } from 'date-fns/getSeconds';
import { getWeek } from 'date-fns/getWeek';
import { getYear } from 'date-fns/getYear';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { isEqual } from 'date-fns/isEqual';
import { isSameDay } from 'date-fns/isSameDay';
import { isSameHour } from 'date-fns/isSameHour';
import { isSameYear } from 'date-fns/isSameYear';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isValid } from 'date-fns/isValid';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { Locale as DateFnsLocale, FormatLong } from 'date-fns/locale';
import { enUS } from 'date-fns/locale/en-US';
import { parse } from 'date-fns/parse';
import { setDate } from 'date-fns/setDate';
import { setHours } from 'date-fns/setHours';
import { setMilliseconds } from 'date-fns/setMilliseconds';
import { setMinutes } from 'date-fns/setMinutes';
import { setMonth } from 'date-fns/setMonth';
import { setSeconds } from 'date-fns/setSeconds';
import { setYear } from 'date-fns/setYear';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfHour } from 'date-fns/startOfHour';
import { startOfMinute } from 'date-fns/startOfMinute';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfSecond } from 'date-fns/startOfSecond';
import { startOfYear } from 'date-fns/startOfYear';
import { startOfWeek } from 'date-fns/startOfWeek';
import { TZDate } from '@date-fns/tz';
import {
  TemporalAdapterFormats,
  DateBuilderReturnType,
  TemporalTimezone,
  TemporalAdapter,
  TemporalFormatTokenConfigMap,
} from '../types';

// TODO: Try to import from date-fns
const dateLongFormatter = (pattern: string, formatLong: FormatLong) => {
  switch (pattern) {
    case 'P':
      return formatLong.date({ width: 'short' });
    case 'PP':
      return formatLong.date({ width: 'medium' });
    case 'PPP':
      return formatLong.date({ width: 'long' });
    case 'PPPP':
    default:
      return formatLong.date({ width: 'full' });
  }
};

const timeLongFormatter = (pattern: string, formatLong: FormatLong) => {
  switch (pattern) {
    case 'p':
      return formatLong.time({ width: 'short' });
    case 'pp':
      return formatLong.time({ width: 'medium' });
    case 'ppp':
      return formatLong.time({ width: 'long' });
    case 'pppp':
    default:
      return formatLong.time({ width: 'full' });
  }
};

const dateTimeLongFormatter = (pattern: string, formatLong: FormatLong) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];

  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong);
  }

  let dateTimeFormat;

  switch (datePattern) {
    case 'P':
      dateTimeFormat = formatLong.dateTime({ width: 'short' });
      break;
    case 'PP':
      dateTimeFormat = formatLong.dateTime({ width: 'medium' });
      break;
    case 'PPP':
      dateTimeFormat = formatLong.dateTime({ width: 'long' });
      break;
    case 'PPPP':
    default:
      dateTimeFormat = formatLong.dateTime({ width: 'full' });
      break;
  }

  return dateTimeFormat
    .replace('{{date}}', dateLongFormatter(datePattern, formatLong))
    .replace('{{time}}', timeLongFormatter(timePattern, formatLong));
};

export const longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter,
};

const FORMAT_TOKEN_CONFIG_MAP: TemporalFormatTokenConfigMap = {
  // Year
  y: { part: 'year', contentType: 'digit' },
  yy: { part: 'year', contentType: 'digit' },
  yyy: { part: 'year', contentType: 'digit' },
  yyyy: { part: 'year', contentType: 'digit' },

  // Month
  M: { part: 'month', contentType: 'digit' },
  MM: { part: 'month', contentType: 'digit' },
  MMMM: { part: 'month', contentType: 'letter' },
  MMM: { part: 'month', contentType: 'letter' },
  L: { part: 'month', contentType: 'digit' },
  LL: { part: 'month', contentType: 'digit' },
  LLL: { part: 'month', contentType: 'letter' },
  LLLL: { part: 'month', contentType: 'letter' },

  // Day of the month
  d: { part: 'day', contentType: 'digit' },
  dd: { part: 'day', contentType: 'digit' },
  do: { part: 'day', contentType: 'digit-with-letter' },

  // Day of the week
  E: { part: 'weekDay', contentType: 'letter' },
  EE: { part: 'weekDay', contentType: 'letter' },
  EEE: { part: 'weekDay', contentType: 'letter' },
  EEEE: { part: 'weekDay', contentType: 'letter' },
  EEEEE: { part: 'weekDay', contentType: 'letter' },
  i: { part: 'weekDay', contentType: 'digit' },
  ii: { part: 'weekDay', contentType: 'digit' },
  iii: { part: 'weekDay', contentType: 'letter' },
  iiii: { part: 'weekDay', contentType: 'letter' },
  // eslint-disable-next-line id-denylist
  e: { part: 'weekDay', contentType: 'digit' },
  ee: { part: 'weekDay', contentType: 'digit' },
  eee: { part: 'weekDay', contentType: 'letter' },
  eeee: { part: 'weekDay', contentType: 'letter' },
  eeeee: { part: 'weekDay', contentType: 'letter' },
  eeeeee: { part: 'weekDay', contentType: 'letter' },
  c: { part: 'weekDay', contentType: 'digit' },
  cc: { part: 'weekDay', contentType: 'digit' },
  ccc: { part: 'weekDay', contentType: 'letter' },
  cccc: { part: 'weekDay', contentType: 'letter' },
  ccccc: { part: 'weekDay', contentType: 'letter' },
  cccccc: { part: 'weekDay', contentType: 'letter' },

  // Meridiem
  a: { part: 'meridiem', contentType: 'letter' },
  aa: { part: 'meridiem', contentType: 'letter' },
  aaa: { part: 'meridiem', contentType: 'letter' },

  // Hours
  H: { part: 'hours', contentType: 'digit' },
  HH: { part: 'hours', contentType: 'digit' },
  h: { part: 'hours', contentType: 'digit' },
  hh: { part: 'hours', contentType: 'digit' },
  // Minutes
  m: { part: 'minutes', contentType: 'digit' },
  mm: { part: 'minutes', contentType: 'digit' },

  // Seconds
  s: { part: 'seconds', contentType: 'digit' },
  ss: { part: 'seconds', contentType: 'digit' },
};

const FORMATS: TemporalAdapterFormats = {
  // Digit formats with leading zeroes
  yearPadded: 'yyyy',
  monthPadded: 'MM',
  dayOfMonthPadded: 'dd',
  hours24hPadded: 'HH',
  hours12hPadded: 'hh',
  minutesPadded: 'mm',
  secondsPadded: 'ss',

  // Digit formats without leading zeroes
  dayOfMonth: 'd',
  hours24h: 'H',
  hours12h: 'h',

  // Digit with letter formats
  dayOfMonthWithLetter: 'do',

  // Letter formats
  month3Letters: 'MMM',
  monthFullLetter: 'MMMM',
  weekday: 'EEEE',
  weekday3Letters: 'EEE',
  weekday1Letter: 'EEEEE',
  meridiem: 'a',

  // Full formats
  localizedDateWithFullMonthAndWeekDay: 'PPPP',
  localizedNumericDate: 'P', // Note: Day and month are padded on enUS unlike Luxon
};

declare module '@base-ui/react/types' {
  interface TemporalSupportedObjectLookup {
    'date-fns': Date;
  }
}

export class TemporalAdapterDateFns implements TemporalAdapter {
  public isTimezoneCompatible = true;

  public lib = 'date-fns';

  private locale: DateFnsLocale;

  public formats = FORMATS;

  public formatTokenConfigMap = FORMAT_TOKEN_CONFIG_MAP;

  public escapedCharacters = { start: "'", end: "'" };

  constructor({ locale }: TemporalAdapterDateFns.ConstructorParameters = {}) {
    this.locale = locale ?? enUS;
  }

  public now = (timezone: TemporalTimezone) => {
    if (timezone === 'system' || timezone === 'default') {
      return new Date();
    }

    return TZDate.tz(timezone);
  };

  public date = <T extends string | null>(
    value: T,
    timezone: TemporalTimezone,
  ): DateBuilderReturnType<T> => {
    type R = DateBuilderReturnType<T>;
    if (value === null) {
      return null as unknown as R;
    }

    const date = new Date(value);
    if (timezone === 'system' || timezone === 'default') {
      return date as unknown as R;
    }

    // `new TZDate(value, timezone)` returns a date with the same timestamp `new Date(value)` would return,
    // whereas we want to create that represents the string in the given timezone.
    return new TZDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
      timezone,
    ) as unknown as R;
  };

  public parse = (value: string, format: string, timezone: TemporalTimezone): Date => {
    const date = parse(value, format, new Date(), {
      locale: this.locale,
    });

    if (timezone === 'system' || timezone === 'default') {
      return date;
    }

    // `new TZDate(value, timezone)` returns a date with the same timestamp `new Date(value)` would return,
    // whereas we want to create that represents the string in the given timezone.
    return new TZDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
      timezone,
    );
  };

  public getTimezone = (value: Date): string => {
    if (value instanceof TZDate) {
      return value.timeZone ?? 'system';
    }

    return 'system';
  };

  public setTimezone = (value: Date, timezone: TemporalTimezone): Date => {
    const isSystemTimezone = timezone === 'system' || timezone === 'default';

    if (value instanceof TZDate) {
      if (isSystemTimezone) {
        return this.toJsDate(value);
      }
      return value.withTimeZone(timezone);
    }

    if (isSystemTimezone) {
      return value;
    }
    return new TZDate(value, timezone);
  };

  public toJsDate = (value: Date) => {
    if (value instanceof TZDate) {
      return new Date(value.getTime());
    }
    return value;
  };

  public getCurrentLocaleCode = () => {
    return this.locale.code;
  };

  public isValid = (value: Date | null): value is Date => {
    if (value == null) {
      return false;
    }

    return isValid(value);
  };

  public format = (value: Date, formatKey: keyof TemporalAdapterFormats) => {
    return this.formatByString(value, this.formats[formatKey]);
  };

  public formatByString = (value: Date, format: string) => {
    return dateFnsFormat(value, format, { locale: this.locale });
  };

  public is12HourCycleInCurrentLocale = () => {
    return /a/.test(this.locale.formatLong!.time({ width: 'short' }));
  };

  public expandFormat = (format: string) => {
    const longFormatRegexp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

    // @see https://github.com/date-fns/date-fns/blob/master/src/format/index.js#L31
    return format
      .match(longFormatRegexp)!
      .map((token: string) => {
        const firstCharacter = token[0];
        if (firstCharacter === 'p' || firstCharacter === 'P') {
          const longFormatter = longFormatters[firstCharacter];
          return longFormatter(token, this.locale.formatLong);
        }
        return token;
      })
      .join('');
  };

  public isEqual = (value: Date | null, comparing: Date | null) => {
    if (value === null && comparing === null) {
      return true;
    }

    if (value === null || comparing === null) {
      return false;
    }

    return isEqual(value, comparing);
  };

  public isSameYear = (value: Date, comparing: Date) => {
    return isSameYear(value, comparing);
  };

  public isSameMonth = (value: Date, comparing: Date) => {
    return isSameMonth(value, comparing);
  };

  public isSameDay = (value: Date, comparing: Date) => {
    return isSameDay(value, comparing);
  };

  public isSameHour = (value: Date, comparing: Date) => {
    return isSameHour(value, comparing);
  };

  public isAfter = (value: Date, comparing: Date) => {
    return isAfter(value, comparing);
  };

  public isBefore = (value: Date, comparing: Date) => {
    return isBefore(value, comparing);
  };

  public isWithinRange = (value: Date, [start, end]: [Date, Date]) => {
    return isWithinInterval(value, { start, end });
  };

  public startOfYear = (value: Date) => {
    return startOfYear(value);
  };

  public startOfMonth = (value: Date) => {
    return startOfMonth(value);
  };

  public startOfWeek = (value: Date) => {
    return startOfWeek(value, { locale: this.locale });
  };

  public startOfDay = (value: Date) => {
    return startOfDay(value);
  };

  public startOfHour = (value: Date) => {
    return startOfHour(value);
  };

  public startOfMinute = (value: Date) => {
    return startOfMinute(value);
  };

  public startOfSecond = (value: Date) => {
    return startOfSecond(value);
  };

  public endOfYear = (value: Date): Date => {
    return endOfYear(value);
  };

  public endOfMonth = (value: Date): Date => {
    return endOfMonth(value);
  };

  public endOfWeek = (value: Date): Date => {
    return endOfWeek(value, { locale: this.locale });
  };

  public endOfDay = (value: Date): Date => {
    return endOfDay(value);
  };

  public endOfHour = (value: Date) => {
    return endOfHour(value);
  };

  public endOfMinute = (value: Date) => {
    return endOfMinute(value);
  };

  public endOfSecond = (value: Date) => {
    return endOfSecond(value);
  };

  public addYears = (value: Date, amount: number): Date => {
    return addYears(value, amount);
  };

  public addMonths = (value: Date, amount: number): Date => {
    return addMonths(value, amount);
  };

  public addWeeks = (value: Date, amount: number): Date => {
    return addWeeks(value, amount);
  };

  public addDays = (value: Date, amount: number): Date => {
    return addDays(value, amount);
  };

  public addHours = (value: Date, amount: number): Date => {
    return addHours(value, amount);
  };

  public addMinutes = (value: Date, amount: number): Date => {
    return addMinutes(value, amount);
  };

  public addSeconds = (value: Date, amount: number): Date => {
    return addSeconds(value, amount);
  };

  public addMilliseconds = (value: Date, amount: number) => {
    return addMilliseconds(value, amount);
  };

  public getYear = (value: Date): number => {
    return getYear(value);
  };

  public getMonth = (value: Date): number => {
    return getMonth(value);
  };

  public getDate = (value: Date): number => {
    return getDate(value);
  };

  public getHours = (value: Date): number => {
    return getHours(value);
  };

  public getMinutes = (value: Date): number => {
    return getMinutes(value);
  };

  public getSeconds = (value: Date): number => {
    return getSeconds(value);
  };

  public getMilliseconds = (value: Date): number => {
    return getMilliseconds(value);
  };

  public getTime = (value: Date): number => {
    return value.getTime();
  };

  public setYear = (value: Date, year: number): Date => {
    return setYear(value, year);
  };

  public setMonth = (value: Date, month: number): Date => {
    return setMonth(value, month);
  };

  public setDate = (value: Date, date: number): Date => {
    return setDate(value, date);
  };

  public setHours = (value: Date, hours: number): Date => {
    return setHours(value, hours);
  };

  public setMinutes = (value: Date, minutes: number): Date => {
    return setMinutes(value, minutes);
  };

  public setSeconds = (value: Date, seconds: number): Date => {
    return setSeconds(value, seconds);
  };

  public setMilliseconds = (value: Date, milliseconds: number): Date => {
    return setMilliseconds(value, milliseconds);
  };

  public differenceInYears = (value: Date, comparing: Date): number => {
    return differenceInYears(value, comparing);
  };

  public differenceInMonths = (value: Date, comparing: Date): number => {
    return differenceInMonths(value, comparing);
  };

  public differenceInWeeks = (value: Date, comparing: Date): number => {
    return differenceInWeeks(value, comparing);
  };

  public differenceInDays = (value: Date, comparing: Date): number => {
    return differenceInDays(value, comparing);
  };

  public differenceInHours = (value: Date, comparing: Date): number => {
    return differenceInHours(value, comparing);
  };

  public differenceInMinutes = (value: Date, comparing: Date): number => {
    return differenceInMinutes(value, comparing);
  };

  public getDaysInMonth = (value: Date): number => {
    return getDaysInMonth(value);
  };

  public getWeekNumber = (value: Date) => {
    return getWeek(value, { locale: this.locale });
  };

  public getDayOfWeek = (value: Date) => {
    const weekStartsOn = this.locale.options?.weekStartsOn ?? 0;
    return ((getDay(value) + 7 - weekStartsOn) % 7) + 1;
  };
}

export namespace TemporalAdapterDateFns {
  export interface ConstructorParameters {
    /**
     * The locale to use for formatting and parsing dates.
     * @default enUS
     */
    locale?: DateFnsLocale | undefined;
  }
}
