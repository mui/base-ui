'use client';
/* eslint-disable class-methods-use-this */
import { DateTime, Info } from 'luxon';
import {
  TemporalAdapterFormats,
  TemporalAdapterParameters,
  DateBuilderReturnType,
  TemporalTimezone,
  TemporalTokenMap,
  TemporalAdapter,
} from '../models';

const tokenMap: TemporalTokenMap = {
  // Year
  y: { sectionType: 'year', contentType: 'digit', maxLength: 4 },
  yy: { sectionType: 'year', contentType: 'digit' },
  yyyy: { sectionType: 'year', contentType: 'digit', maxLength: 4 },

  // Month
  L: { sectionType: 'month', contentType: 'digit', maxLength: 2 },
  LL: { sectionType: 'month', contentType: 'digit' },
  LLL: { sectionType: 'month', contentType: 'letter' },
  LLLL: { sectionType: 'month', contentType: 'letter' },
  M: { sectionType: 'month', contentType: 'digit', maxLength: 2 },
  MM: { sectionType: 'month', contentType: 'digit' },
  MMM: { sectionType: 'month', contentType: 'letter' },
  MMMM: { sectionType: 'month', contentType: 'letter' },

  // Day of the month
  d: { sectionType: 'day', contentType: 'digit', maxLength: 2 },
  dd: { sectionType: 'day', contentType: 'digit' },

  // Day of the week
  c: { sectionType: 'weekDay', contentType: 'digit', maxLength: 1 },
  ccc: { sectionType: 'weekDay', contentType: 'letter' },
  cccc: { sectionType: 'weekDay', contentType: 'letter' },
  E: { sectionType: 'weekDay', contentType: 'digit', maxLength: 2 },
  EEE: { sectionType: 'weekDay', contentType: 'letter' },
  EEEE: { sectionType: 'weekDay', contentType: 'letter' },

  // Meridiem
  a: { sectionType: 'meridiem', contentType: 'letter' },

  // Hours
  H: { sectionType: 'hours', contentType: 'digit', maxLength: 2 },
  HH: { sectionType: 'hours', contentType: 'digit' },
  h: { sectionType: 'hours', contentType: 'digit', maxLength: 2 },
  hh: { sectionType: 'hours', contentType: 'digit' },

  // Minutes
  m: { sectionType: 'minutes', contentType: 'digit', maxLength: 2 },
  mm: { sectionType: 'minutes', contentType: 'digit' },

  // Seconds
  s: { sectionType: 'seconds', contentType: 'digit', maxLength: 2 },
  ss: { sectionType: 'seconds', contentType: 'digit' },
};

const defaultFormats: TemporalAdapterFormats = {
  year: 'yyyy',
  monthLeadingZeros: 'MM',
  dayOfMonth: 'dd',
  dayOfMonthNoLeadingZeros: 'd',
  weekday: 'cccc',
  weekday3Letters: 'ccccc',
  hours24hLeadingZeros: 'HH',
  hours12hLeadingZeros: 'hh',
  meridiem: 'a',
  minutesLeadingZeros: 'mm',
  secondsLeadingZeros: 'ss',
};

declare module '@base-ui-components/react/models' {
  interface TemporalSupportedObjectLookup {
    luxon: DateTime;
  }
}

/**
 * Based on `@date-io/luxon`
 *
 * MIT License
 *
 * Copyright (c) 2017 Dmitriy Kovalenko
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export class TemporalAdapterLuxon implements TemporalAdapter<string> {
  public isTimezoneCompatible = true;

  public lib = 'luxon';

  public locale: string;

  public formats: TemporalAdapterFormats;

  public escapedCharacters = { start: "'", end: "'" };

  public formatTokenMap = tokenMap;

  constructor({ locale, formats }: TemporalAdapterParameters<string, never> = {}) {
    this.locale = locale || 'en-US';
    this.formats = { ...defaultFormats, ...formats };
  }

  private setLocaleToValue = (value: DateTime) => {
    const expectedLocale = this.getCurrentLocaleCode();
    if (expectedLocale === value.locale) {
      return value;
    }

    return value.setLocale(expectedLocale);
  };

  public date = <T extends string | null | undefined>(
    value?: T,
    timezone: TemporalTimezone = 'default',
  ): DateBuilderReturnType<T> => {
    type R = DateBuilderReturnType<T>;
    if (value === null) {
      return <R>null;
    }

    if (typeof value === 'undefined') {
      // @ts-ignore
      return <R>DateTime.fromJSDate(new Date(), { locale: this.locale, zone: timezone });
    }

    // @ts-ignore
    return <R>DateTime.fromISO(value, { locale: this.locale, zone: timezone });
  };

  public getInvalidDate = () => DateTime.fromJSDate(new Date('Invalid Date'));

  public getTimezone = (value: DateTime): string => {
    // When using the system zone, we want to return "system", not something like "Europe/Paris"
    if (value.zone.type === 'system') {
      return 'system';
    }

    return value.zoneName!;
  };

  public setTimezone = (value: DateTime, timezone: TemporalTimezone): DateTime => {
    if (!value.zone.equals(Info.normalizeZone(timezone))) {
      return value.setZone(timezone);
    }

    return value;
  };

  public toJsDate = (value: DateTime) => {
    return value.toJSDate();
  };

  public parse = (value: string, formatString: string) => {
    if (value === '') {
      return null;
    }

    return DateTime.fromFormat(value, formatString, { locale: this.locale });
  };

  public getCurrentLocaleCode = () => {
    return this.locale;
  };

  /* v8 ignore start */
  public is12HourCycleInCurrentLocale = () => {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
      return true; // Luxon defaults to en-US if Intl not found
    }

    return Boolean(
      new Intl.DateTimeFormat(this.locale, { hour: 'numeric' })?.resolvedOptions()?.hour12,
    );
  };
  /* v8 ignore stop */

  public expandFormat = (format: string) => {
    // Extract escaped section to avoid extending them
    const catchEscapedSectionsRegexp = /''|'(''|[^'])+('|$)|[^']*/g;

    // This RegExp tests if a string is only mad of supported tokens
    const validTokens = [...Object.keys(this.formatTokenMap), 'yyyyy'];
    const isWordComposedOfTokens = new RegExp(`^(${validTokens.join('|')})+$`);

    // Extract words to test if they are a token or a word to escape.
    const catchWordsRegexp = /(?:^|[^a-z])([a-z]+)(?:[^a-z]|$)|([a-z]+)/gi;
    return (
      format
        .match(catchEscapedSectionsRegexp)!
        .map((token: string) => {
          const firstCharacter = token[0];
          if (firstCharacter === "'") {
            return token;
          }
          const expandedToken = DateTime.expandFormat(token, { locale: this.locale });

          return expandedToken.replace(catchWordsRegexp, (substring, g1, g2) => {
            const word = g1 || g2; // words are either in group 1 or group 2

            if (isWordComposedOfTokens.test(word)) {
              return substring;
            }
            return `'${substring}'`;
          });
        })
        .join('')
        // The returned format can contain `yyyyy` which means year between 4 and 6 digits.
        // This value is supported by luxon parser but not luxon formatter.
        // To avoid conflicts, we replace it by 4 digits which is enough for most use-cases.
        .replace('yyyyy', 'yyyy')
    );
  };

  public isValid = (value: DateTime | null): value is DateTime => {
    if (value === null) {
      return false;
    }

    return value.isValid;
  };

  public format = (value: DateTime, formatKey: keyof TemporalAdapterFormats) => {
    return this.formatByString(value, this.formats[formatKey]);
  };

  public formatByString = (value: DateTime, format: string) => {
    return value.setLocale(this.locale).toFormat(format);
  };

  public formatNumber = (numberToFormat: string) => {
    return numberToFormat;
  };

  public isEqual = (value: DateTime | null, comparing: DateTime | null) => {
    if (value === null && comparing === null) {
      return true;
    }

    if (value === null || comparing === null) {
      return false;
    }

    return +value === +comparing;
  };

  public isSameYear = (value: DateTime, comparing: DateTime) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'year');
  };

  public isSameMonth = (value: DateTime, comparing: DateTime) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'month');
  };

  public isSameDay = (value: DateTime, comparing: DateTime) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'day');
  };

  public isSameHour = (value: DateTime, comparing: DateTime) => {
    const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
    return value.hasSame(comparingInValueTimezone, 'hour');
  };

  public isAfter = (value: DateTime, comparing: DateTime, unit: 'year' | 'day' | null = null) => {
    if (unit === 'year') {
      const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
      const diff = value.diff(this.endOfYear(comparingInValueTimezone), 'years').toObject();
      return diff.years! > 0;
    }

    if (unit === 'day') {
      const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
      const diff = value.diff(this.endOfDay(comparingInValueTimezone), 'days').toObject();
      return diff.days! > 0;
    }

    return value > comparing;
  };

  public isBefore = (value: DateTime, comparing: DateTime, unit: 'year' | 'day' | null = null) => {
    if (unit === 'year') {
      const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
      const diff = value.diff(this.startOfYear(comparingInValueTimezone), 'years').toObject();
      return diff.years! < 0;
    }

    if (unit === 'day') {
      const comparingInValueTimezone = this.setTimezone(comparing, this.getTimezone(value));
      const diff = value.diff(this.startOfDay(comparingInValueTimezone), 'days').toObject();
      return diff.days! < 0;
    }

    return value < comparing;
  };

  public isWithinRange = (value: DateTime, [start, end]: [DateTime, DateTime]) => {
    return (
      this.isEqual(value, start) ||
      this.isEqual(value, end) ||
      (this.isAfter(value, start) && this.isBefore(value, end))
    );
  };

  public startOfYear = (value: DateTime) => {
    return value.startOf('year');
  };

  public startOfMonth = (value: DateTime) => {
    return value.startOf('month');
  };

  public startOfWeek = (value: DateTime) => {
    return this.setLocaleToValue(value).startOf('week', { useLocaleWeeks: true });
  };

  public startOfDay = (value: DateTime) => {
    return value.startOf('day');
  };

  public startOfHour = (value: DateTime) => {
    return value.startOf('hour');
  };

  public startOfMinute = (value: DateTime) => {
    return value.startOf('minute');
  };

  public startOfSecond = (value: DateTime) => {
    return value.startOf('second');
  };

  public endOfYear = (value: DateTime) => {
    return value.endOf('year');
  };

  public endOfMonth = (value: DateTime) => {
    return value.endOf('month');
  };

  public endOfWeek = (value: DateTime) => {
    return this.setLocaleToValue(value).endOf('week', { useLocaleWeeks: true });
  };

  public endOfDay = (value: DateTime) => {
    return value.endOf('day');
  };

  public endOfHour = (value: DateTime) => {
    return value.endOf('hour');
  };

  public endOfMinute = (value: DateTime) => {
    return value.endOf('minute');
  };

  public endOfSecond = (value: DateTime) => {
    return value.endOf('second');
  };

  public addYears = (value: DateTime, amount: number) => {
    return value.plus({ years: amount });
  };

  public addMonths = (value: DateTime, amount: number) => {
    return value.plus({ months: amount });
  };

  public addWeeks = (value: DateTime, amount: number) => {
    return value.plus({ weeks: amount });
  };

  public addDays = (value: DateTime, amount: number) => {
    return value.plus({ days: amount });
  };

  public addHours = (value: DateTime, amount: number) => {
    return value.plus({ hours: amount });
  };

  public addMinutes = (value: DateTime, amount: number) => {
    return value.plus({ minutes: amount });
  };

  public addSeconds = (value: DateTime, amount: number) => {
    return value.plus({ seconds: amount });
  };

  public getYear = (value: DateTime) => {
    return value.get('year');
  };

  public getMonth = (value: DateTime) => {
    // See https://github.com/moment/luxon/blob/master/docs/moment.md#major-functional-differences
    return value.get('month') - 1;
  };

  public getDate = (value: DateTime) => {
    return value.get('day');
  };

  public getHours = (value: DateTime) => {
    return value.get('hour');
  };

  public getMinutes = (value: DateTime) => {
    return value.get('minute');
  };

  public getSeconds = (value: DateTime) => {
    return value.get('second');
  };

  public getMilliseconds = (value: DateTime) => {
    return value.get('millisecond');
  };

  public setYear = (value: DateTime, year: number) => {
    return value.set({ year });
  };

  public setMonth = (value: DateTime, month: number) => {
    return value.set({ month: month + 1 });
  };

  public setDate = (value: DateTime, date: number) => {
    return value.set({ day: date });
  };

  public setHours = (value: DateTime, hours: number) => {
    return value.set({ hour: hours });
  };

  public setMinutes = (value: DateTime, minutes: number) => {
    return value.set({ minute: minutes });
  };

  public setSeconds = (value: DateTime, seconds: number) => {
    return value.set({ second: seconds });
  };

  public setMilliseconds = (value: DateTime, milliseconds: number) => {
    return value.set({ millisecond: milliseconds });
  };

  public getDaysInMonth = (value: DateTime) => {
    return value.daysInMonth!;
  };

  public getWeekArray = (value: DateTime) => {
    const firstDay = this.startOfWeek(this.startOfMonth(value));
    const lastDay = this.endOfWeek(this.endOfMonth(value));

    const { days } = lastDay.diff(firstDay, 'days').toObject();

    const weeks: DateTime[][] = [];
    new Array<number>(Math.round(days!))
      .fill(0)
      .map((_, i) => i)
      .map((day) => firstDay.plus({ days: day }))
      .forEach((v, i) => {
        if (i === 0 || (i % 7 === 0 && i > 6)) {
          weeks.push([v]);
          return;
        }

        weeks[weeks.length - 1].push(v);
      });

    return weeks;
  };

  public getWeekNumber = (value: DateTime) => {
    /* v8 ignore next */
    return value.localWeekNumber ?? value.weekNumber;
  };

  public getDayOfWeek = (value: DateTime) => {
    return value.weekday;
  };

  public getYearRange = ([start, end]: [DateTime, DateTime]) => {
    const startDate = this.startOfYear(start);
    const endDate = this.endOfYear(end);
    const years: DateTime[] = [];

    let current = startDate;
    while (this.isBefore(current, endDate)) {
      years.push(current);
      current = this.addYears(current, 1);
    }

    return years;
  };
}
