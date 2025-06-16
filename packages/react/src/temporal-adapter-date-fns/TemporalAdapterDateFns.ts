'use client';
/* eslint-disable class-methods-use-this */
import { addDays } from 'date-fns/addDays';
import { addHours } from 'date-fns/addHours';
import { addMinutes } from 'date-fns/addMinutes';
import { addMonths } from 'date-fns/addMonths';
import { addSeconds } from 'date-fns/addSeconds';
import { addMilliseconds } from 'date-fns/addMilliseconds';
import { addWeeks } from 'date-fns/addWeeks';
import { addYears } from 'date-fns/addYears';
import { endOfDay } from 'date-fns/endOfDay';
import { endOfHour } from 'date-fns/endOfHour';
import { endOfMinute } from 'date-fns/endOfMinute';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfSecond } from 'date-fns/endOfSecond';
import { endOfWeek } from 'date-fns/endOfWeek';
import { endOfYear } from 'date-fns/endOfYear';
import { format as dateFnsFormat } from 'date-fns/format';
import { getDate } from 'date-fns/getDate';
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
import { Locale as DateFnsLocale } from 'date-fns/locale';
import { enUS } from 'date-fns/locale/en-US';
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
import {
  TemporalAdapterFormats,
  DateBuilderReturnType,
  TemporalTimezone,
  TemporalAdapter,
} from '../models';

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

  // Letter formats
  weekday: 'EEEE',
  weekday3Letters: 'EEE',
  meridiem: 'a',

  // Full formats
  localizedDateWithFullMonthAndWeekDay: 'PPPP',
  fullMonthAndYear: 'MMMM yyyy',
};

declare module '@base-ui-components/react/models' {
  interface TemporalSupportedObjectLookup {
    'date-fns': Date;
  }
}

export class TemporalAdapterDateFns implements TemporalAdapter {
  public isTimezoneCompatible = false;

  public lib = 'date-fns';

  private locale: DateFnsLocale;

  public formats = FORMATS;

  public escapedCharacters = { start: "'", end: "'" };

  constructor({ locale }: TemporalAdapterDateFns.ConstructorParameters = {}) {
    this.locale = locale ?? enUS;
  }

  public now = (timezone: TemporalTimezone) => {
    // @ts-ignore
    return new Date();
  };

  public date = <T extends string | null>(
    value: T,
    timezone: TemporalTimezone,
  ): DateBuilderReturnType<T> => {
    type R = DateBuilderReturnType<T>;
    if (value === null) {
      return null as unknown as R;
    }

    return new Date(value) as unknown as R;
  };

  public getTimezone = (): string => {
    return 'default';
  };

  public setTimezone = (value: Date): Date => {
    return value;
  };

  public toJsDate = (value: Date) => {
    return value;
  };

  public getCurrentLocaleCode = () => {
    // `code` is undefined only in `date-fns` types, but all locales have it
    return this.locale.code!;
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

  public getDaysInMonth = (value: Date): number => {
    return getDaysInMonth(value);
  };

  public getWeekNumber = (value: Date) => {
    return getWeek(value, { locale: this.locale });
  };

  public getDayOfWeek = (value: Date) => {
    return value.getDay() + 1;
  };
}

export namespace TemporalAdapterDateFns {
  export interface ConstructorParameters {
    /**
     * The locale to use for formatting and parsing dates.
     * @default enUS
     */
    locale?: DateFnsLocale;
  }
}
