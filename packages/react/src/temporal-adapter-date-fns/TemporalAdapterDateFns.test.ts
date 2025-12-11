import { fr } from 'date-fns/locale/fr';
import { describeGregorianAdapter } from '#test-utils';
import { TemporalAdapterDateFns } from './TemporalAdapterDateFns';

describe('TemporalAdapterDateFns', () => {
  describeGregorianAdapter({
    adapter: new TemporalAdapterDateFns(),
    adapterFr: new TemporalAdapterDateFns({ locale: fr }),
    setDefaultTimezone: null,
    // The Date object doesn't contain a locale
    createDateInFrenchLocale: (dateStr) => new Date(dateStr),
  });
});
