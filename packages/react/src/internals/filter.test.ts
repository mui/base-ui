import { expect, describe, it, vi } from 'vitest';
import { getFilter, getTextMatcher } from './filter';

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

  it.each([
    { name: 'short hyphen runs', punctuation: '-', count: 10 },
    { name: 'long hyphen runs', punctuation: '-', count: 100 },
    { name: 'whitespace runs', punctuation: ' ', count: 100 },
    { name: 'supplementary punctuation runs', punctuation: '\u{10100}', count: 100 },
  ])(
    'keeps comparison counts linear for unmatched labels surrounded by $name',
    ({ punctuation, count }) => {
      const compare = vi.fn(
        new Intl.Collator('en', {
          usage: 'search',
          sensitivity: 'base',
          ignorePunctuation: true,
        }).compare,
      );
      vi.spyOn(Intl.Collator.prototype, 'compare', 'get').mockReturnValue(compare);
      const contains = getFilter({ locale: 'en' }).contains;
      const padding = punctuation.repeat(count);
      const text = `${padding}alpha${padding}`;

      expect(contains(text, 'bravo')).toBe(false);
      expect(compare.mock.calls.length).toBeLessThan(text.length * 3);
      expect(contains(text, 'alpha')).toBe(true);
    },
  );

  describe.each(['contains', 'startsWith', 'endsWith'] as const)('%s', (method) => {
    function label(text: string) {
      if (method === 'startsWith') {
        return `${text} action`;
      }
      if (method === 'endsWith') {
        return `Open ${text}`;
      }
      return `Open ${text} action`;
    }

    it.each([
      ['Sign-in', 'signin'],
      ['signin', 'Sign-in'],
      ['Sign\u2011in', 'signin'],
      ['sign in', 'signin'],
      ['signin', 'sign\u00a0in'],
      [' - Sign--in - ', 'signin'],
      ['signin', ' - Sign--in - '],
    ])('ignores punctuation and whitespace in %s when matching %s', (text, query) => {
      expect(getFilter({ locale: 'en' })[method](label(text), query)).toBe(true);
    });

    it.each([
      ['Résumé', 'Re\u0301sume\u0301'],
      ['Re\u0301sume\u0301', 'Résumé'],
    ])('matches canonically equivalent text %s with %s', (text, query) => {
      const match = getFilter({ locale: 'en', sensitivity: 'variant' })[method];

      expect(match(label(text), query)).toBe(true);
    });

    it('respects explicit punctuation sensitivity', () => {
      const match = getFilter({ locale: 'en', ignorePunctuation: false })[method];

      expect(match(label('Sign-in'), 'signin')).toBe(false);
      expect(match(label('signin'), 'Sign-in')).toBe(false);
      expect(match(label('sign in'), 'signin')).toBe(false);
      expect(match(label('Sign-in'), 'sign-in')).toBe(true);
    });

    it('preserves locale-specific letters and sensitivity options', () => {
      expect(getFilter({ locale: 'sv' })[method](label('Örebro'), 'orebro')).toBe(false);
      expect(getFilter({ locale: 'sv' })[method](label('Örebro'), 'o\u0308rebro')).toBe(true);
      expect(
        getFilter({ locale: 'en', sensitivity: 'accent' })[method](label('Résumé'), 'resume'),
      ).toBe(false);
      expect(
        getFilter({ locale: 'en', sensitivity: 'case' })[method](label('Resume'), 'resume'),
      ).toBe(false);
    });

    it('preserves symbols that are not punctuation', () => {
      expect(getFilter({ locale: 'en' })[method](label('a+b'), 'ab')).toBe(false);
      expect(getFilter({ locale: 'en' })[method](label('ab'), 'a+b')).toBe(false);
    });

    it.each([
      { locale: 'ca', text: 'col·legi', query: 'collegi' },
      { locale: 'da', text: 'a a', query: 'aa' },
    ])(
      'preserves language-sensitive punctuation and spacing in $locale',
      ({ locale, text, query }) => {
        expect(getFilter({ locale })[method](label(text), query)).toBe(false);
        expect(getFilter({ locale })[method](label(text), text)).toBe(true);
        expect(getFilter({ locale: 'en' })[method](label(text), query)).toBe(true);
        expect(getTextMatcher({ locale }).equals(text, query)).toBe(false);
      },
    );

    it('matches punctuation participating in a locale-specific letter', () => {
      expect(getFilter({ locale: 'ca' })[method](label('col·legi'), 'coŀlegi')).toBe(true);
      expect(getFilter({ locale: 'ca' })[method](label('coŀlegi'), 'col·legi')).toBe(true);
    });

    it('preserves meaningful trailing punctuation at a candidate boundary', () => {
      const match = getFilter({ locale: 'ca' })[method];

      expect(match(label('l·'), 'ŀ')).toBe(true);
      expect(match(label('·l·'), 'ŀ')).toBe(true);
    });

    it('matches an empty query and a query containing only ignored characters', () => {
      const match = getFilter({ locale: 'en' })[method];

      expect(match('Sign-in', '')).toBe(true);
      expect(match('Sign-in', ' - ')).toBe(true);
      expect(match('', ' - ')).toBe(true);
    });

    it('normalizes the result of itemToString', () => {
      expect(
        getFilter({ locale: 'en' })[method](
          { name: label('Sign-in') },
          'signin',
          (item) => item.name,
        ),
      ).toBe(true);
    });
  });
});

describe('getTextMatcher', () => {
  it('compares whole text independently of substring matching', () => {
    const matcher = getTextMatcher({ locale: 'en' });

    expect(matcher.equals('Sign-in', 'signin')).toBe(true);
    expect(matcher.equals('Résumé', 'Re\u0301sume\u0301')).toBe(true);
    expect(matcher.equals('foobar', 'foo---')).toBe(false);
    expect(matcher.filter.contains('foobar', 'foo---')).toBe(true);
    expect(matcher.equals('abcabc', 'abc')).toBe(false);
  });

  it('uses the configured collation rules for equality', () => {
    expect(getTextMatcher({ locale: 'sv' }).equals('Örebro', 'orebro')).toBe(false);
    expect(
      getTextMatcher({ locale: 'en', ignorePunctuation: false }).equals('Sign-in', 'signin'),
    ).toBe(false);
    expect(getTextMatcher({ locale: 'en', sensitivity: 'accent' }).equals('Résumé', 'resume')).toBe(
      false,
    );
    expect(getTextMatcher({ locale: 'en', sensitivity: 'case' }).equals('Resume', 'resume')).toBe(
      false,
    );
  });
});
