import { describe, expect, it } from 'vitest';
import { getCanonicalReactDocsUrl } from './canonicalReactDocsUrl';

describe('getCanonicalReactDocsUrl', () => {
  it.each([
    ['/react/(components)/accordion', '/react/accordion'],
    ['/react/components/accordion', '/react/accordion'],
    ['/react/(overview)/releases/v1-6-0', '/react/releases/v1-6-0'],
    ['/react/overview/releases/v1-6-0', '/react/releases/v1-6-0'],
    ['/react/components/accordion.md', '/react/accordion.md'],
    [
      '/react/(components)/accordion.md?plain=1#api-reference',
      '/react/accordion.md?plain=1#api-reference',
    ],
  ])('normalizes %s', (url, expected) => {
    expect(getCanonicalReactDocsUrl(url)).toBe(expected);
  });

  it.each([
    ['/react/overview', '/react/quick-start'],
    ['/react/handbook', '/react/styling'],
    ['/react/components', '/react/accordion'],
    ['/react/utils', '/react/csp-provider'],
    ['/react/(overview)', '/react/quick-start'],
    ['/react/(handbook)', '/react/styling'],
    ['/react/(components)', '/react/accordion'],
    ['/react/(utils)', '/react/csp-provider'],
  ])('maps the %s section root to its first page', (url, expected) => {
    expect(getCanonicalReactDocsUrl(url)).toBe(expected);
  });

  it.each(['/react/accordion', '/react/releases/v1-6-0', '/react', '/experiments/test'])(
    'leaves %s unchanged',
    (url) => {
      expect(getCanonicalReactDocsUrl(url)).toBe(url);
    },
  );
});
