import { expect } from 'chai';
import {
  TemporalAdapter,
  TemporalSupportedObject,
  TemporalTimezone,
} from '@base-ui-components/react/models';
import { DescribeGregorianAdapterTestSuite } from './describeGregorianAdapter.types';
import { TEST_DATE_ISO_STRING, TEST_DATE_LOCALE_STRING } from './describeGregorianAdapter.utils';

/**
 * To check if the date has the right offset even after changing its date parts,
 * we convert it to a different timezone that always has the same offset,
 * then we check that both dates have the same hour value.
 */
// We change to
const expectSameTimeInMonacoTZ = (adapter: TemporalAdapter, value: TemporalSupportedObject) => {
  const valueInMonacoTz = adapter.setTimezone(value, 'Europe/Monaco');
  expect(adapter.getHours(value)).to.equal(adapter.getHours(valueInMonacoTz));
};

export const testComputations: DescribeGregorianAdapterTestSuite = ({
  adapter,
  adapterTZ = adapter,
  adapterFr,
  setDefaultTimezone,
}) => {
  const testDateIso = adapter.date(TEST_DATE_ISO_STRING, 'default')!;
  const testDateLastNonDSTDay = adapterTZ.isTimezoneCompatible
    ? adapterTZ.date('2022-03-27', 'Europe/Paris')
    : adapterTZ.date('2022-03-27', 'default');
  const testDateLocale = adapter.date(TEST_DATE_LOCALE_STRING, 'default')!;

  describe('Method: date', () => {
    it('should parse ISO strings', () => {
      if (adapter.isTimezoneCompatible) {
        const test = (timezone: TemporalTimezone, expectedTimezones: string = timezone) => {
          [adapterTZ, adapterFr].forEach((instance) => {
            const dateWithZone = instance.date(TEST_DATE_ISO_STRING, timezone);
            expect(instance.getTimezone(dateWithZone)).to.equal(expectedTimezones);

            // Should keep the time of the value in the UTC timezone
            expect(dateWithZone).toEqualDateTime(TEST_DATE_ISO_STRING);
          });
        };

        test('UTC');
        test('system');
        test('America/New_York');
        test('Europe/Paris');

        setDefaultTimezone('America/New_York');
        test('default', 'America/New_York');

        setDefaultTimezone('Europe/Paris');
        test('default', 'Europe/Paris');

        // Reset to the default timezone
        setDefaultTimezone(undefined);
      } else {
        expect(adapter.date(TEST_DATE_ISO_STRING, 'system')).toEqualDateTime(TEST_DATE_ISO_STRING);
        expect(adapter.date(TEST_DATE_ISO_STRING, 'default')).toEqualDateTime(TEST_DATE_ISO_STRING);
      }
    });

    it('should parse locale strings', () => {
      if (adapter.isTimezoneCompatible) {
        const test = (timezone: TemporalTimezone) => {
          [adapterTZ, adapterFr].forEach((instance) => {
            const dateWithZone = instance.date(TEST_DATE_LOCALE_STRING, timezone);
            expect(instance.getTimezone(dateWithZone)).to.equal(timezone);

            // Should keep the time of the date in the target timezone
            expect(instance.format(dateWithZone, 'hours24hPadded')).to.equal('00');
          });
        };

        test('UTC');
        test('system');
        test('America/New_York');
        test('Europe/Paris');
      } else {
        expect(adapter.date(TEST_DATE_LOCALE_STRING, 'system')).toEqualDateTime(
          TEST_DATE_LOCALE_STRING,
        );
      }
    });

    it('should parse null', () => {
      expect(adapter.date(null, 'system')).to.equal(null);

      if (adapter.isTimezoneCompatible) {
        expect(adapter.date(null, 'UTC')).to.equal(null);
        expect(adapter.date(null, 'America/New_York')).to.equal(null);
      }
    });
  });

  describe('Method: now', () => {
    test.skipIf(adapterTZ.lib !== 'dayjs')('should support system timezone', () => {
      if (adapter.isTimezoneCompatible) {
        const testTodayZone = (timezone: TemporalTimezone) => {
          const dateWithZone = adapterTZ.now(timezone);
          expect(adapterTZ.getTimezone(dateWithZone)).to.equal(timezone);
          expect(Math.abs(adapterTZ.toJsDate(dateWithZone).getTime() - Date.now())).to.be.lessThan(
            5,
          );
        };

        testTodayZone('system');
        testTodayZone('UTC');
        testTodayZone('America/New_York');
      } else {
        expect(
          Math.abs(adapterTZ.toJsDate(adapter.now('system')).getTime() - Date.now()),
        ).to.be.lessThan(5);
      }
    });
  });

  test.skipIf(!adapter.isTimezoneCompatible)('Method: getTimezone', () => {
    const testTimezone = (timezone: string, expectedTimezone = timezone) => {
      expect(adapter.getTimezone(adapter.now(timezone))).to.equal(expectedTimezone);
    };

    testTimezone('system');
    testTimezone('Europe/Paris');
    testTimezone('America/New_York');
    testTimezone('UTC');

    setDefaultTimezone('America/Chicago');
    testTimezone('default', 'America/Chicago');
    setDefaultTimezone(undefined);
  });

  test.skipIf(!adapter.isTimezoneCompatible)(
    'should not mix Europe/London and UTC in winter',
    () => {
      const dateWithZone = adapter.date('2023-10-30T11:44:00.000Z', 'Europe/London');
      expect(adapter.getTimezone(dateWithZone)).to.equal('Europe/London');
    },
  );

  it('Method: setTimezone', () => {
    if (adapter.isTimezoneCompatible) {
      const test = (timezone: TemporalTimezone) => {
        setDefaultTimezone(timezone);
        const dateWithLocaleTimezone = adapter.date(TEST_DATE_ISO_STRING, 'system');
        const dateWithDefaultTimezone = adapter.setTimezone(dateWithLocaleTimezone, 'default');

        expect(adapter.getTimezone(dateWithDefaultTimezone)).to.equal(timezone);
      };

      test('America/New_York');
      test('Europe/Paris');

      // Reset to the default timezone
      setDefaultTimezone(undefined);
    } else {
      const systemDate = adapter.date(TEST_DATE_ISO_STRING, 'system');
      expect(adapter.setTimezone(systemDate, 'default')).toEqualDateTime(systemDate);
      expect(adapter.setTimezone(systemDate, 'system')).toEqualDateTime(systemDate);

      const defaultDate = adapter.date(TEST_DATE_ISO_STRING, 'default');
      expect(adapter.setTimezone(systemDate, 'default')).toEqualDateTime(defaultDate);
      expect(adapter.setTimezone(systemDate, 'system')).toEqualDateTime(defaultDate);
    }
  });

  it('Method: toJsDate', () => {
    expect(adapter.toJsDate(testDateIso)).to.be.instanceOf(Date);
    expect(adapter.toJsDate(testDateLocale)).to.be.instanceOf(Date);
  });

  it('Method: isValid', () => {
    const invalidDate = adapter.date('2018-42-30T11:60:00.000Z', 'default');

    expect(adapter.isValid(testDateIso)).to.equal(true);
    expect(adapter.isValid(testDateLocale)).to.equal(true);
    expect(adapter.isValid(invalidDate)).to.equal(false);
    expect(adapter.isValid(null)).to.equal(false);
  });

  describe('Method: isEqual', () => {
    it('should work in the same timezone', () => {
      expect(adapter.isEqual(adapter.date(null, 'default'), null)).to.equal(true);
      expect(adapter.isEqual(testDateIso, adapter.date(TEST_DATE_ISO_STRING, 'default'))).to.equal(
        true,
      );
      expect(adapter.isEqual(null, testDateIso)).to.equal(false);
      expect(
        adapter.isEqual(testDateLocale, adapter.date(TEST_DATE_LOCALE_STRING, 'default')),
      ).to.equal(true);
      expect(adapter.isEqual(null, testDateLocale)).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      const dateInLondonTZ = adapterTZ.setTimezone(testDateIso, 'Europe/London');
      const dateInParisTZ = adapterTZ.setTimezone(testDateIso, 'Europe/Paris');

      expect(adapterTZ.isEqual(dateInLondonTZ, dateInParisTZ)).to.equal(true);
    });
  });

  describe('Method: isSameYear', () => {
    it('should work in the same timezone', () => {
      expect(
        adapter.isSameYear(testDateIso, adapter.date('2018-10-01T00:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameYear(testDateIso, adapter.date('2019-10-01T00:00:00.000Z', 'default')),
      ).to.equal(false);
      expect(
        adapter.isSameYear(testDateLocale, adapter.date('2018-10-01T00:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameYear(testDateLocale, adapter.date('2019-10-01T00:00:00.000Z', 'default')),
      ).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      // Both dates below have the same timestamp, but they are not in the same year when represented in their respective timezone.
      // The adapter should still consider that they are in the same year.
      const dateInLondonTZ = adapterTZ.endOfYear(
        adapterTZ.setTimezone(testDateIso, 'Europe/London'),
      );
      const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

      expect(adapterTZ.isSameYear(dateInLondonTZ, dateInParisTZ)).to.equal(true);
      expect(adapterTZ.isSameYear(dateInParisTZ, dateInLondonTZ)).to.equal(true);
    });
  });

  describe('Method: isSameMonth', () => {
    it('should work in the same timezone', () => {
      expect(
        adapter.isSameMonth(testDateIso, adapter.date('2018-10-01T00:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameMonth(testDateIso, adapter.date('2019-10-01T00:00:00.000Z', 'default')),
      ).to.equal(false);
      expect(
        adapter.isSameMonth(testDateLocale, adapter.date('2018-10-01T00:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameMonth(testDateLocale, adapter.date('2019-10-01T00:00:00.000Z', 'default')),
      ).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      // Both dates below have the same timestamp, but they are not in the same month when represented in their respective timezone.
      // The adapter should still consider that they are in the same month.
      const dateInLondonTZ = adapterTZ.endOfMonth(
        adapterTZ.setTimezone(testDateIso, 'Europe/London'),
      );
      const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

      expect(adapterTZ.isSameMonth(dateInLondonTZ, dateInParisTZ)).to.equal(true);
      expect(adapterTZ.isSameMonth(dateInParisTZ, dateInLondonTZ)).to.equal(true);
    });
  });

  describe('Method: isSameDay', () => {
    it('should work in the same timezone', () => {
      expect(
        adapter.isSameDay(testDateIso, adapter.date('2018-10-30T00:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameDay(testDateIso, adapter.date('2019-10-30T00:00:00.000Z', 'default')),
      ).to.equal(false);
      expect(
        adapter.isSameDay(testDateLocale, adapter.date('2018-10-30T00:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameDay(testDateLocale, adapter.date('2019-10-30T00:00:00.000Z', 'default')),
      ).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      // Both dates below have the same timestamp, but they are not in the same day when represented in their respective timezone.
      // The adapter should still consider that they are in the same day.
      const dateInLondonTZ = adapterTZ.endOfDay(
        adapterTZ.setTimezone(testDateIso, 'Europe/London'),
      );
      const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

      expect(adapterTZ.isSameDay(dateInLondonTZ, dateInParisTZ)).to.equal(true);
      expect(adapterTZ.isSameDay(dateInParisTZ, dateInLondonTZ)).to.equal(true);
    });
  });

  describe('Method: isSameHour', () => {
    it('should work in the same timezone', () => {
      expect(
        adapter.isSameHour(testDateIso, adapter.date('2018-10-30T11:00:00.000Z', 'default')),
      ).to.equal(true);
      expect(
        adapter.isSameHour(testDateIso, adapter.date('2018-10-30T12:00:00.000Z', 'default')),
      ).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      // Both dates below have the same timestamp, but they are not in the same day when represented in their respective timezone.
      // The adapter should still consider that they are in the same day.
      const dateInLondonTZ = adapterTZ.setTimezone(testDateIso, 'Europe/London');
      const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

      expect(adapterTZ.isSameHour(dateInLondonTZ, dateInParisTZ)).to.equal(true);
      expect(adapterTZ.isSameHour(dateInParisTZ, dateInLondonTZ)).to.equal(true);
    });
  });

  describe('Method: isAfter', () => {
    it('should work with the same timezone', () => {
      expect(adapter.isAfter(adapter.now('default'), testDateIso)).to.equal(true);
      expect(adapter.isAfter(testDateIso, adapter.now('default'))).to.equal(false);

      expect(adapter.isAfter(adapter.now('default'), testDateLocale)).to.equal(true);
      expect(adapter.isAfter(testDateLocale, adapter.now('default'))).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      const dateInLondonTZ = adapterTZ.endOfDay(
        adapterTZ.setTimezone(testDateIso, 'Europe/London'),
      );
      const dateInParisTZ = adapterTZ.addMinutes(
        adapterTZ.endOfDay(adapterTZ.setTimezone(testDateIso, 'Europe/Paris')),
        30,
      );

      expect(adapter.isAfter(dateInLondonTZ, dateInParisTZ)).to.equal(true);
      expect(adapter.isAfter(dateInParisTZ, dateInLondonTZ)).to.equal(false);
    });

    it('should work in the same timezone (unit="year")', () => {
      const nextYearIso = adapter.addYears(testDateIso, 1);
      expect(adapter.isAfter(nextYearIso, testDateIso, 'year')).to.equal(true);
      expect(adapter.isAfter(testDateIso, nextYearIso, 'year')).to.equal(false);

      const nextYearLocale = adapter.addYears(testDateLocale, 1);
      expect(adapter.isAfter(nextYearLocale, testDateLocale, 'year')).to.equal(true);
      expect(adapter.isAfter(testDateLocale, nextYearLocale, 'year')).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)(
      'should work with different timezones (unit="year")',
      () => {
        // Both dates below have the same timestamp, but they are not in the same year when represented in their respective timezone.
        // The adapter should still consider that they are in the same year.
        const dateInLondonTZ = adapterTZ.endOfYear(
          adapterTZ.setTimezone(testDateIso, 'Europe/London'),
        );
        const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

        expect(adapterTZ.isAfter(dateInLondonTZ, dateInParisTZ, 'year')).to.equal(false);
        expect(adapterTZ.isAfter(dateInParisTZ, dateInLondonTZ, 'year')).to.equal(false);
      },
    );

    it('should work with the same timezone (unit="day")', () => {
      const nextDayIso = adapter.addDays(testDateIso, 1);
      expect(adapter.isAfter(nextDayIso, testDateIso, 'day')).to.equal(true);
      expect(adapter.isAfter(testDateIso, nextDayIso, 'day')).to.equal(false);

      const nextDayLocale = adapter.addDays(testDateLocale, 1);
      expect(adapter.isAfter(nextDayLocale, testDateLocale, 'day')).to.equal(true);
      expect(adapter.isAfter(testDateLocale, nextDayLocale, 'day')).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)(
      'should work with different timezones (unit="day")',
      () => {
        // Both dates below have the same timestamp, but they are not in the same day when represented in their respective timezone.
        // The adapter should still consider that they are in the same day.
        const dateInLondonTZ = adapterTZ.endOfDay(
          adapterTZ.setTimezone(testDateIso, 'Europe/London'),
        );
        const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

        expect(adapterTZ.isAfter(dateInLondonTZ, dateInParisTZ, 'day')).to.equal(false);
        expect(adapterTZ.isAfter(dateInParisTZ, dateInLondonTZ, 'day')).to.equal(false);

        // Both dates below have the same day when represented in their respective timezone,
        // But not when represented in the same timezone
        // The adapter should consider that they are not in the same day
        const dateInLondonTZ2 = adapterTZ.startOfDay(
          adapterTZ.setTimezone(testDateIso, 'Europe/London'),
        );
        const dateInParisTZ2 = adapterTZ.addHours(
          adapterTZ.setTimezone(dateInLondonTZ2, 'Europe/Paris'),
          -1,
        );

        expect(adapterTZ.isAfter(dateInLondonTZ2, dateInParisTZ2, 'day')).to.equal(true);
        expect(adapterTZ.isAfter(dateInParisTZ2, dateInLondonTZ2, 'day')).to.equal(false);
      },
    );
  });

  describe('Method: isBefore', () => {
    it('should work with the same timezone', () => {
      expect(adapter.isBefore(testDateIso, adapter.now('default'))).to.equal(true);
      expect(adapter.isBefore(adapter.now('default'), testDateIso)).to.equal(false);

      expect(adapter.isBefore(testDateLocale, adapter.now('default'))).to.equal(true);
      expect(adapter.isBefore(adapter.now('default'), testDateLocale)).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should work with different timezones', () => {
      const dateInLondonTZ = adapterTZ.endOfDay(
        adapterTZ.setTimezone(testDateIso, 'Europe/London'),
      );
      const dateInParisTZ = adapterTZ.addMinutes(
        adapterTZ.endOfDay(adapterTZ.setTimezone(testDateIso, 'Europe/Paris')),
        30,
      );

      expect(adapter.isBefore(dateInLondonTZ, dateInParisTZ)).to.equal(false);
      expect(adapter.isBefore(dateInParisTZ, dateInLondonTZ)).to.equal(true);
    });

    it('should work in the same timezone (unit="year"', () => {
      const nextYearIso = adapter.addYears(testDateIso, -1);
      expect(adapter.isBefore(nextYearIso, testDateIso, 'year')).to.equal(true);
      expect(adapter.isBefore(testDateIso, nextYearIso, 'year')).to.equal(false);

      const nextYearLocale = adapter.addYears(testDateLocale, -1);
      expect(adapter.isBefore(nextYearLocale, testDateLocale, 'year')).to.equal(true);
      expect(adapter.isBefore(testDateLocale, nextYearLocale, 'year')).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)(
      'should work with different timezones (unit="year")',
      () => {
        // Both dates below have the same timestamp, but they are not in the same year when represented in their respective timezone.
        // The adapter should still consider that they are in the same year.
        const dateInLondonTZ = adapterTZ.endOfYear(
          adapterTZ.setTimezone(testDateIso, 'Europe/London'),
        );
        const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

        expect(adapterTZ.isBefore(dateInLondonTZ, dateInParisTZ, 'year')).to.equal(false);
        expect(adapterTZ.isBefore(dateInParisTZ, dateInLondonTZ, 'year')).to.equal(false);
      },
    );

    it('should work with the same timezone (unit="day")', () => {
      const previousDayIso = adapter.addDays(testDateIso, -1);
      expect(adapter.isBefore(previousDayIso, testDateIso, 'day')).to.equal(true);
      expect(adapter.isBefore(testDateIso, previousDayIso, 'day')).to.equal(false);

      const previousDayLocale = adapter.addDays(testDateLocale, -1);
      expect(adapter.isBefore(previousDayLocale, testDateLocale, 'day')).to.equal(true);
      expect(adapter.isBefore(testDateLocale, previousDayLocale, 'day')).to.equal(false);
    });

    test.skipIf(!adapter.isTimezoneCompatible)(
      'should work with different timezones (unit="day")',
      () => {
        // Both dates below have the same timestamp, but they are not in the same day when represented in their respective timezone.
        // The adapter should still consider that they are in the same day.
        const dateInLondonTZ = adapterTZ.endOfDay(
          adapterTZ.setTimezone(testDateIso, 'Europe/London'),
        );
        const dateInParisTZ = adapterTZ.setTimezone(dateInLondonTZ, 'Europe/Paris');

        expect(adapterTZ.isBefore(dateInLondonTZ, dateInParisTZ, 'day')).to.equal(false);
        expect(adapterTZ.isBefore(dateInParisTZ, dateInLondonTZ, 'day')).to.equal(false);

        // Both dates below have the same day when represented in their respective timezone,
        // But not when represented in the same timezone
        // The adapter should consider that they are not in the same day
        const dateInLondonTZ2 = adapterTZ.endOfDay(
          adapterTZ.setTimezone(testDateIso, 'Europe/London'),
        );
        const dateInParisTZ2 = adapterTZ.addHours(
          adapterTZ.setTimezone(dateInLondonTZ2, 'Europe/Paris'),
          -1,
        );

        expect(adapterTZ.isBefore(dateInLondonTZ2, dateInParisTZ2, 'day')).to.equal(false);
        expect(adapterTZ.isBefore(dateInParisTZ2, dateInLondonTZ2, 'day')).to.equal(true);
      },
    );
  });

  describe('Method: isWithinRange', () => {
    it('should work on simple examples', () => {
      expect(
        adapter.isWithinRange(adapter.date('2019-10-01T00:00:00.000Z', 'default'), [
          adapter.date('2019-09-01T00:00:00.000Z', 'default'),
          adapter.date('2019-11-01T00:00:00.000Z', 'default'),
        ]),
      ).to.equal(true);

      expect(
        adapter.isWithinRange(adapter.date('2019-12-01T00:00:00.000Z', 'default'), [
          adapter.date('2019-09-01T00:00:00.000Z', 'default'),
          adapter.date('2019-11-01T00:00:00.000Z', 'default'),
        ]),
      ).to.equal(false);

      expect(
        adapter.isWithinRange(adapter.date('2019-10-01', 'default'), [
          adapter.date('2019-09-01', 'default'),
          adapter.date('2019-11-01', 'default'),
        ]),
      ).to.equal(true);

      expect(
        adapter.isWithinRange(adapter.date('2019-12-01', 'default'), [
          adapter.date('2019-09-01', 'default'),
          adapter.date('2019-11-01', 'default'),
        ]),
      ).to.equal(false);
    });

    it('should use inclusiveness of range', () => {
      expect(
        adapter.isWithinRange(adapter.date('2019-09-01T00:00:00.000Z', 'default'), [
          adapter.date('2019-09-01T00:00:00.000Z', 'default'),
          adapter.date('2019-12-01T00:00:00.000Z', 'default'),
        ]),
      ).to.equal(true);

      expect(
        adapter.isWithinRange(adapter.date('2019-12-01T00:00:00.000Z', 'default'), [
          adapter.date('2019-09-01T00:00:00.000Z', 'default'),
          adapter.date('2019-12-01T00:00:00.000Z', 'default'),
        ]),
      ).to.equal(true);

      expect(
        adapter.isWithinRange(adapter.date('2019-09-01', 'default'), [
          adapter.date('2019-09-01', 'default'),
          adapter.date('2019-12-01', 'default'),
        ]),
      ).to.equal(true);

      expect(
        adapter.isWithinRange(adapter.date('2019-12-01', 'default'), [
          adapter.date('2019-09-01', 'default'),
          adapter.date('2019-12-01', 'default'),
        ]),
      ).to.equal(true);
    });

    it('should be equal with values in different locales', () => {
      expect(
        adapter.isWithinRange(adapter.date('2022-04-17', 'default'), [
          adapterFr.date('2022-04-17', 'default'),
          adapterFr.date('2022-04-19', 'default'),
        ]),
      ).to.equal(true);
    });
  });

  it('Method: startOfYear', () => {
    const expected = '2018-01-01T00:00:00.000Z';
    expect(adapter.startOfYear(testDateIso)).toEqualDateTime(expected);
    expect(adapter.startOfYear(testDateLocale)).toEqualDateTime(expected);
  });

  it('Method: startOfMonth', () => {
    const expected = '2018-10-01T00:00:00.000Z';
    expect(adapter.startOfMonth(testDateIso)).toEqualDateTime(expected);
    expect(adapter.startOfMonth(testDateLocale)).toEqualDateTime(expected);
  });

  it('Method: startOfWeek', () => {
    expect(adapter.startOfWeek(testDateIso)).toEqualDateTime('2018-10-28T00:00:00.000Z');
    expect(adapter.startOfWeek(testDateLocale)).toEqualDateTime('2018-10-28T00:00:00.000Z');
  });

  it('Method: startOfDay', () => {
    const expected = '2018-10-30T00:00:00.000Z';
    expect(adapter.startOfDay(testDateIso)).toEqualDateTime(expected);
    expect(adapter.startOfDay(testDateLocale)).toEqualDateTime(expected);
  });

  it('Method: endOfYear', () => {
    const expected = '2018-12-31T23:59:59.999Z';
    expect(adapter.endOfYear(testDateIso)).toEqualDateTime(expected);
    expect(adapter.endOfYear(testDateLocale)).toEqualDateTime(expected);
  });

  describe('Method: endOfMonth', () => {
    it('should handle basic use-cases', () => {
      const expected = '2018-10-31T23:59:59.999Z';
      expect(adapter.endOfMonth(testDateIso)).toEqualDateTime(expected);
      expect(adapter.endOfMonth(testDateLocale)).toEqualDateTime(expected);
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should update the offset when entering DST', () => {
      expectSameTimeInMonacoTZ(adapterTZ, testDateLastNonDSTDay);
      expectSameTimeInMonacoTZ(adapterTZ, adapterTZ.endOfMonth(testDateLastNonDSTDay));
    });
  });

  it('Method: endOfWeek', () => {
    expect(adapter.endOfWeek(testDateIso)).toEqualDateTime('2018-11-03T23:59:59.999Z');
    expect(adapter.endOfWeek(testDateLocale)).toEqualDateTime('2018-11-03T23:59:59.999Z');
  });

  it('Method: endOfDay', () => {
    const expected = '2018-10-30T23:59:59.999Z';
    expect(adapter.endOfDay(testDateIso)).toEqualDateTime(expected);
    expect(adapter.endOfDay(testDateLocale)).toEqualDateTime(expected);
  });

  it('Method: addYears', () => {
    expect(adapter.addYears(testDateIso, 2)).toEqualDateTime('2020-10-30T11:44:00.000Z');
    expect(adapter.addYears(testDateIso, -2)).toEqualDateTime('2016-10-30T11:44:00.000Z');
  });

  describe('Method: addMonths', () => {
    it('should handle basic use-cases', () => {
      expect(adapter.addMonths(testDateIso, 2)).toEqualDateTime('2018-12-30T11:44:00.000Z');
      expect(adapter.addMonths(testDateIso, -2)).toEqualDateTime('2018-08-30T11:44:00.000Z');
      expect(adapter.addMonths(testDateIso, 3)).toEqualDateTime('2019-01-30T11:44:00.000Z');
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should update the offset when entering DST', () => {
      expectSameTimeInMonacoTZ(adapterTZ, testDateLastNonDSTDay);
      expectSameTimeInMonacoTZ(adapterTZ, adapterTZ.addMonths(testDateLastNonDSTDay, 1));
    });
  });

  describe('Method: addWeeks', () => {
    it('should handle basic use-cases', () => {
      expect(adapter.addWeeks(testDateIso, 2)).toEqualDateTime('2018-11-13T11:44:00.000Z');
      expect(adapter.addWeeks(testDateIso, -2)).toEqualDateTime('2018-10-16T11:44:00.000Z');
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should update the offset when entering DST', () => {
      expectSameTimeInMonacoTZ(adapterTZ, testDateLastNonDSTDay);
      expectSameTimeInMonacoTZ(adapterTZ, adapterTZ.addWeeks(testDateLastNonDSTDay, 1));
    });
  });

  describe('Method: addWeeks', () => {
    it('should handle basic use-cases', () => {
      expect(adapter.addDays(testDateIso, 2)).toEqualDateTime('2018-11-01T11:44:00.000Z');
      expect(adapter.addDays(testDateIso, -2)).toEqualDateTime('2018-10-28T11:44:00.000Z');
    });

    test.skipIf(!adapter.isTimezoneCompatible)('should update the offset when entering DST', () => {
      expectSameTimeInMonacoTZ(adapterTZ, testDateLastNonDSTDay);
      expectSameTimeInMonacoTZ(adapterTZ, adapterTZ.addDays(testDateLastNonDSTDay, 1));
    });
  });

  it('Method: addHours', () => {
    expect(adapter.addHours(testDateIso, 2)).toEqualDateTime('2018-10-30T13:44:00.000Z');
    expect(adapter.addHours(testDateIso, -2)).toEqualDateTime('2018-10-30T09:44:00.000Z');
    expect(adapter.addHours(testDateIso, 15)).toEqualDateTime('2018-10-31T02:44:00.000Z');
  });

  it('Method: addMinutes', () => {
    expect(adapter.addMinutes(testDateIso, 2)).toEqualDateTime('2018-10-30T11:46:00.000Z');
    expect(adapter.addMinutes(testDateIso, -2)).toEqualDateTime('2018-10-30T11:42:00.000Z');
    expect(adapter.addMinutes(testDateIso, 20)).toEqualDateTime('2018-10-30T12:04:00.000Z');
  });

  it('Method: addSeconds', () => {
    expect(adapter.addSeconds(testDateIso, 2)).toEqualDateTime('2018-10-30T11:44:02.000Z');
    expect(adapter.addSeconds(testDateIso, -2)).toEqualDateTime('2018-10-30T11:43:58.000Z');
    expect(adapter.addSeconds(testDateIso, 70)).toEqualDateTime('2018-10-30T11:45:10.000Z');
  });

  it('Method: getYear', () => {
    expect(adapter.getYear(testDateIso)).to.equal(2018);
  });

  it('Method: getMonth', () => {
    expect(adapter.getMonth(testDateIso)).to.equal(9);
  });

  it('Method: getDate', () => {
    expect(adapter.getDate(testDateIso)).to.equal(30);
  });

  it('Method: getHours', () => {
    expect(adapter.getHours(testDateIso)).to.equal(11);
  });

  it('Method: getMinutes', () => {
    expect(adapter.getMinutes(testDateIso)).to.equal(44);
  });

  it('Method: getSeconds', () => {
    expect(adapter.getSeconds(testDateIso)).to.equal(0);
  });

  it('Method: getMilliseconds', () => {
    expect(adapter.getMilliseconds(testDateIso)).to.equal(0);
  });

  it('Method: setYear', () => {
    expect(adapter.setYear(testDateIso, 2011)).toEqualDateTime('2011-10-30T11:44:00.000Z');
  });

  it('Method: setMonth', () => {
    expect(adapter.setMonth(testDateIso, 4)).toEqualDateTime('2018-05-30T11:44:00.000Z');
  });

  it('Method: setDate', () => {
    expect(adapter.setDate(testDateIso, 15)).toEqualDateTime('2018-10-15T11:44:00.000Z');
  });

  it('Method: setHours', () => {
    expect(adapter.setHours(testDateIso, 0)).toEqualDateTime('2018-10-30T00:44:00.000Z');
  });

  it('Method: setMinutes', () => {
    expect(adapter.setMinutes(testDateIso, 12)).toEqualDateTime('2018-10-30T11:12:00.000Z');
  });

  it('Method: setSeconds', () => {
    expect(adapter.setSeconds(testDateIso, 11)).toEqualDateTime('2018-10-30T11:44:11.000Z');
  });

  it('Method: setMilliseconds', () => {
    expect(adapter.setMilliseconds(testDateIso, 11)).toEqualDateTime('2018-10-30T11:44:00.011Z');
  });

  it('Method: getDaysInMonth', () => {
    expect(adapter.getDaysInMonth(testDateIso)).to.equal(31);
    expect(adapter.getDaysInMonth(testDateLocale)).to.equal(31);
    expect(adapter.getDaysInMonth(adapter.addMonths(testDateIso, 1))).to.equal(30);
  });

  it('Method: getDayOfWeek', () => {
    expect(adapter.getDayOfWeek(testDateIso)).to.equal(3);
  });

  it('Method: getWeekNumber', () => {
    expect(adapter.getWeekNumber(testDateIso)).to.equal(44);
  });
};
