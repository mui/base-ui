import { describe, it, expect, onTestFinished } from 'vitest';
import { DateTime, Settings } from 'luxon';
import { describeGregorianAdapter } from '#test-utils';
import { TemporalAdapterLuxon } from './TemporalAdapterLuxon';

describe('TemporalAdapterLuxon', () => {
  describeGregorianAdapter({
    // @ts-expect-error Luxon returns DateTime; the shared adapter types currently only support Date.
    adapter: new TemporalAdapterLuxon(),
    // @ts-expect-error Luxon returns DateTime; the shared adapter types currently only support Date.
    adapterFr: new TemporalAdapterLuxon({ locale: 'fr' }),
    setDefaultTimezone: (timezone) => {
      Settings.defaultZone = timezone ?? 'system';
    },
    // @ts-expect-error The Gregorian helper expects Date while Luxon creates a DateTime.
    createDateInFrenchLocale: (dateStr) => DateTime.fromISO(dateStr, { locale: 'fr' }),
    // @ts-expect-error Luxon returns DateTime; the shared adapter types currently only support Date.
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
      // @ts-expect-error adapter.date is typed as Date but returns a Luxon DateTime at runtime.
      expect(adapter.isWeekend(friday)).toBe(true);
    });
  });
});
