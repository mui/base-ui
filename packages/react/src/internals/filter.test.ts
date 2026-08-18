import { expect } from 'vitest';
import { getFilter } from './filter';

describe('getFilter', () => {
  it('caches different locales separately', () => {
    const filter1 = getFilter({ locale: new Intl.Locale('fr-FR') });
    const filter2 = getFilter({ locale: new Intl.Locale('en-US') });

    expect(filter1).not.toBe(filter2);
  });

  it('caches equivalent locale inputs', () => {
    const filter1 = getFilter({ locale: new Intl.Locale('fr-FR') });
    const filter2 = getFilter({ locale: 'fr-FR' });

    expect(filter1).toBe(filter2);
  });

  it('matches locale-aware substrings without accent sensitivity', () => {
    const contains = getFilter({ locale: 'en-US' }).contains;

    expect(contains('Résumé', 'resume')).toBe(true);
  });
});
