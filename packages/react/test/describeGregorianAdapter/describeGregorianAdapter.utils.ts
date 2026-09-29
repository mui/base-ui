// TODO Temporal: Replace with `@base-ui/react/types` import when Temporal components will become public.
import type { TemporalAdapter } from '../../src/internals/temporal';

export const TEST_DATE_ISO_STRING = '2018-10-30T11:44:25.750Z';

export const TEST_DATE_LOCALE_STRING = '2018-10-30';

/**
 * Returns the weekend days of the adapter's locale as ISO day numbers (1 is Monday, 7 is Sunday).
 */
export function getAdapterWeekendDays(adapter: TemporalAdapter) {
  // Monday, October 29th 2018
  const monday = adapter.date('2018-10-29T12:00:00.000Z', 'UTC');
  return [1, 2, 3, 4, 5, 6, 7].filter((day) => adapter.isWeekend(adapter.addDays(monday, day - 1)));
}

type IntlWeekInfoApi = 'method' | 'accessor' | 'none';

/**
 * Replaces the Intl.Locale week info APIs to simulate engines that only support
 * the `getWeekInfo()` method, only the `weekInfo` accessor, or none of them.
 * Returns a function that restores the original APIs.
 */
export function stubIntlWeekInfo(api: IntlWeekInfoApi) {
  const prototype = Intl.Locale.prototype;
  const keys = ['getWeekInfo', 'weekInfo'];
  const descriptors = keys.map((key) => Object.getOwnPropertyDescriptor(prototype, key));
  const [methodDescriptor, accessorDescriptor] = descriptors;

  function readWeekInfo(locale: Intl.Locale) {
    return methodDescriptor
      ? methodDescriptor.value.call(locale)
      : accessorDescriptor!.get!.call(locale);
  }

  keys.forEach((key) => Reflect.deleteProperty(prototype, key));

  if (api === 'method') {
    Object.defineProperty(prototype, 'getWeekInfo', {
      configurable: true,
      writable: true,
      value(this: Intl.Locale) {
        return readWeekInfo(this);
      },
    });
  } else if (api === 'accessor') {
    Object.defineProperty(prototype, 'weekInfo', {
      configurable: true,
      get(this: Intl.Locale) {
        return readWeekInfo(this);
      },
    });
  }

  return () => {
    keys.forEach((key, index) => {
      Reflect.deleteProperty(prototype, key);
      const descriptor = descriptors[index];
      if (descriptor) {
        Object.defineProperty(prototype, key, descriptor);
      }
    });
  };
}
