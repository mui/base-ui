// TODO Temporal: Replace with `@base-ui/react/types` import when Temporal components will become public.
import type { TemporalAdapter } from '../../src/internals/temporal';

export const TEST_DATE_ISO_STRING = '2018-10-30T11:44:25.750Z';

export const TEST_DATE_LOCALE_STRING = '2018-10-30';

/**
 * Returns the weekend days of the adapter's locale, from 1 (Monday) to 7 (Sunday).
 */
export function getAdapterWeekendDays(adapter: TemporalAdapter) {
  // Monday, October 29th 2018
  const monday = adapter.date('2018-10-29T12:00:00.000Z', 'UTC');
  return [1, 2, 3, 4, 5, 6, 7].filter((day) => adapter.isWeekend(adapter.addDays(monday, day - 1)));
}

/**
 * Removes the Intl.Locale week info APIs to simulate an engine that doesn't support them.
 * Returns a function that restores them.
 */
export function removeIntlWeekInfo() {
  const prototype = Intl.Locale.prototype;
  const descriptors = ['getWeekInfo', 'weekInfo'].map(
    (key) => [key, Object.getOwnPropertyDescriptor(prototype, key)] as const,
  );
  descriptors.forEach(([key]) => Reflect.deleteProperty(prototype, key));

  return () => {
    descriptors.forEach(([key, descriptor]) => {
      if (descriptor) {
        Object.defineProperty(prototype, key, descriptor);
      }
    });
  };
}
