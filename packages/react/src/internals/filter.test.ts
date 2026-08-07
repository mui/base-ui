import { expect } from 'vitest';
import { getContainsFilter, getFilter } from './filter';

describe('getFilter', () => {
  it('caches different Intl.Locale objects separately', () => {
    const filter1 = getFilter({ locale: new Intl.Locale('fr-FR') });
    const filter2 = getFilter({ locale: new Intl.Locale('en-US') });

    expect(filter1).not.toBe(filter2);
  });
});

describe('getContainsFilter', () => {
  it('matches locale-aware substrings without accent sensitivity', () => {
    const contains = getContainsFilter({ locale: 'en-US' });

    expect(contains('Résumé', 'resume')).toBe(true);
  });

  it('caches equivalent locale inputs', () => {
    const filter1 = getContainsFilter({ locale: new Intl.Locale('fr-FR') });
    const filter2 = getContainsFilter({ locale: 'fr-FR' });

    expect(filter1).toBe(filter2);
  });
});
