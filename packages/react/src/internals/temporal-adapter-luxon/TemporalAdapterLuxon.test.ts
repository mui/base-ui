// TODO: Remove if temporal adapters are supported
// @ts-nocheck No types available
import { describe, it, expect, onTestFinished } from 'vitest';
import { DateTime, Settings } from 'luxon';
import { describeGregorianAdapter, getAdapterWeekendDays, removeIntlWeekInfo } from '#test-utils';
import { TemporalAdapterLuxon } from './TemporalAdapterLuxon';

describe('TemporalAdapterLuxon', () => {
  describeGregorianAdapter({
    adapter: new TemporalAdapterLuxon(),
    adapterFr: new TemporalAdapterLuxon({ locale: 'fr' }),
    setDefaultTimezone: (timezone) => {
      Settings.defaultZone = timezone ?? 'system';
    },
    createDateInFrenchLocale: (dateStr) => DateTime.fromISO(dateStr, { locale: 'fr' }),
  });

  describe('isWeekend', () => {
    it('should use the weekend days of the locale', () => {
      expect(getAdapterWeekendDays(new TemporalAdapterLuxon({ locale: 'en-US' }))).toEqual([6, 7]);
      expect(getAdapterWeekendDays(new TemporalAdapterLuxon({ locale: 'he' }))).toEqual([5, 6]);
      expect(getAdapterWeekendDays(new TemporalAdapterLuxon({ locale: 'fa-IR' }))).toEqual([5]);
      expect(getAdapterWeekendDays(new TemporalAdapterLuxon({ locale: 'en-IN' }))).toEqual([7]);
    });

    it('should fall back to Saturday and Sunday when Intl.Locale has no week info', () => {
      onTestFinished(removeIntlWeekInfo());
      expect(getAdapterWeekendDays(new TemporalAdapterLuxon({ locale: 'he' }))).toEqual([6, 7]);
    });
  });
});
