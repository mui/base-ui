import { expect } from 'chai';
import { getFormatter } from './format';

const getOptions = (): Intl.NumberFormatOptions => ({
  currency: 'USD',
  style: 'currency',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

describe.skip('NumberField format', () => {
  describe('getFormatter', () => {
    it('caches the formatter based on options', () => {
      const formatter1 = getFormatter(undefined, getOptions());
      const formatter2 = getFormatter(undefined, getOptions());
      expect(formatter1).to.equal(formatter2);
    });
  });

  describe('formatNumber', () => {
    it('formats a number', () => {
      expect(getFormatter(undefined, getOptions()).format(1234.56)).to.equal('$1,234.56');
    });

    it('formats a number with different options', () => {
      expect(getFormatter(undefined, { style: 'percent' }).format(0.1234)).to.equal('12%');
    });
  });
});
