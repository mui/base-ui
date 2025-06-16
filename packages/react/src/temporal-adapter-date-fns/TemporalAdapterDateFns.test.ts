import { fr } from 'date-fns/locale/fr';
import { TemporalAdapterDateFns } from '@base-ui-components/react/temporal-adapter-date-fns';
import { describeGregorianAdapter } from '#test-utils';

describe('TemporalAdapterDateFns', () => {
  describeGregorianAdapter({
    adapter: new TemporalAdapterDateFns(),
    adapterFr: new TemporalAdapterDateFns({ locale: fr }),
    setDefaultTimezone: () => {},
    // The Date object doesn't contain a locale
    createDateInFrenchLocale: (dateStr) => new Date(dateStr),
  });
});
