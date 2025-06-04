import { Settings } from 'luxon';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { describeGregorianAdapter } from '#test-utils';

describe('TemporalAdapterLuxon', () => {
  describeGregorianAdapter({
    adapter: new TemporalAdapterLuxon(),
    adapterFr: new TemporalAdapterLuxon({ locale: 'fr' }),
    setDefaultTimezone: (timezone) => {
      Settings.defaultZone = timezone ?? 'system';
    },
  });
});
