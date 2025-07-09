import { expect } from 'vitest';
import { getFormatter } from './formatNumber';

const getOptions = (): Intl.NumberFormatOptions => ({
  currency: 'USD',
  style: 'currency',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

describe('NumberField format', () => {
  describe('getFormatter', () => {
    it('caches the formatter based on options', () => {
      const formatter1 = getFormatter(undefined, getOptions());
      const formatter2 = getFormatter(undefined, getOptions());
      expect(formatter1).to.equal(formatter2);
    });
  });

  describe('formatNumber', () => {
    it('formats a number', () => {
      const expected = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }).format(1234.56);
      expect(getFormatter(undefined, getOptions()).format(1234.56)).to.equal(expected);
    });

    it('formats a number with different options', () => {
      expect(getFormatter(undefined, { style: 'percent' }).format(0.1234)).to.equal('12%');
    });
  });
});
