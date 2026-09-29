import { describe, afterEach, it, expect, onTestFinished } from 'vitest';
import { enIN } from 'date-fns/locale/en-IN';
import { enUS } from 'date-fns/locale/en-US';
import { faIR } from 'date-fns/locale/fa-IR';
import { fr } from 'date-fns/locale/fr';
import { he } from 'date-fns/locale/he';
import { describeGregorianAdapter, getAdapterWeekendDays, removeIntlWeekInfo } from '#test-utils';
import { TemporalAdapterDateFns } from './TemporalAdapterDateFns';

describe('TemporalAdapterDateFns', () => {
  describeGregorianAdapter({
    adapter: new TemporalAdapterDateFns(),
    adapterFr: new TemporalAdapterDateFns({ locale: fr }),
    setDefaultTimezone: null,
    // The Date object doesn't contain a locale
    createDateInFrenchLocale: (dateStr) => new Date(dateStr),
  });

  describe('date-only string parsing (UTC getters)', () => {
    const adapter = new TemporalAdapterDateFns();
    const originalTZ = process.env.TZ;

    afterEach(() => {
      process.env.TZ = originalTZ;
    });

    it('should preserve the date for date-only strings in a negative UTC offset', () => {
      // "2026-04-06" is parsed as UTC midnight by the JS spec.
      // In negative UTC offsets (e.g. UTC-3), local getters would roll back to April 5th.
      process.env.TZ = 'America/Sao_Paulo';
      const result = adapter.date('2026-04-06', 'system');
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(3); // April = 3
      expect(result!.getDate()).toBe(6);
    });

    it('should preserve the date for date-only strings in a named timezone', () => {
      process.env.TZ = 'America/Sao_Paulo';
      const result = adapter.date('2026-04-06', 'America/Sao_Paulo');
      expect(adapter.getYear(result!)).toBe(2026);
      expect(adapter.getMonth(result!)).toBe(3); // April = 3
      expect(adapter.getDate(result!)).toBe(6);
      expect(adapter.getHours(result!)).toBe(0);
    });

    it('should still use local getters for datetime strings', () => {
      process.env.TZ = 'America/Sao_Paulo';
      const result = adapter.date('2026-04-06T14:30:00', 'system');
      expect(result!.getHours()).toBe(14);
      expect(result!.getMinutes()).toBe(30);
    });
  });

  describe('setTimezone duck typing', () => {
    const adapter = new TemporalAdapterDateFns();

    it('should use withTimeZone on non-TZDate objects that support it', () => {
      // Simulates a TZDate-like object from a different copy of @date-fns/tz,
      // where instanceof TZDate would fail but the method is still available.
      const fakeDate = new Date('2026-04-06T12:00:00Z');
      const expected = new Date('2026-04-06T12:00:00Z');
      (fakeDate as any).withTimeZone = () => expected;

      const result = adapter.setTimezone(fakeDate, 'America/New_York');
      expect(result).toBe(expected);
    });
  });

  describe('isWeekend', () => {
    it('should use the weekend days of the locale', () => {
      expect(getAdapterWeekendDays(new TemporalAdapterDateFns({ locale: enUS }))).toEqual([6, 7]);
      expect(getAdapterWeekendDays(new TemporalAdapterDateFns({ locale: he }))).toEqual([5, 6]);
      expect(getAdapterWeekendDays(new TemporalAdapterDateFns({ locale: faIR }))).toEqual([5]);
      expect(getAdapterWeekendDays(new TemporalAdapterDateFns({ locale: enIN }))).toEqual([7]);
    });

    it('should fall back to Saturday and Sunday when Intl.Locale has no week info', () => {
      onTestFinished(removeIntlWeekInfo());
      expect(getAdapterWeekendDays(new TemporalAdapterDateFns({ locale: he }))).toEqual([6, 7]);
    });

    it('should fall back to Saturday and Sunday when the locale code is invalid', () => {
      const locale = { ...he, code: 'not a locale' };
      expect(getAdapterWeekendDays(new TemporalAdapterDateFns({ locale }))).toEqual([6, 7]);
    });
  });
});
