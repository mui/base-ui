// TODO: Remove if temporal adapters are supported
// @ts-nocheck No types available
import { describe, it, expect, onTestFinished } from 'vitest';
import { DateTime, Settings } from 'luxon';
import { describeGregorianAdapter } from '#test-utils';
import { TemporalAdapterLuxon } from './TemporalAdapterLuxon';

describe('TemporalAdapterLuxon', () => {
  describeGregorianAdapter({
    adapter: new TemporalAdapterLuxon(),
    adapterFr: new TemporalAdapterLuxon({ locale: 'fr' }),
    setDefaultTimezone: (timezone) => {
      Settings.defaultZone = timezone ?? 'system';
    },
    createDateInFrenchLocale: (dateStr) => DateTime.fromISO(dateStr, { locale: 'fr' }),
    createAdapterWithLocale: (localeCode) => new TemporalAdapterLuxon({ locale: localeCode }),
  });

  describe('isWeekend', () => {
    it('should respect Settings.defaultWeekSettings', () => {
      const originalWeekSettings = Settings.defaultWeekSettings;
      onTestFinished(() => {
        Settings.defaultWeekSettings = originalWeekSettings;
      });
      Settings.defaultWeekSettings = { firstDay: 1, minimalDays: 4, weekend: [5, 6] };

      const adapter = new TemporalAdapterLuxon({ locale: 'en-US' });
      // Friday
      const friday = adapter.date('2018-11-02T12:00:00.000Z', 'UTC');
      expect(adapter.isWeekend(friday)).toBe(true);
    });
  });
});
