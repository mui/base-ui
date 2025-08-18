import { expect } from 'chai';
import { formatNumber, getFormatter } from '@base-ui-components/utils/formatNumber';
import { formatNumberMaxPrecision } from './formatNumber';

describe('Base UI exported utilities', () => {
  it('should expose public formatting utilities', () => {
    const value = 1234.56;
    const locale = 'en-US';
    const options = { style: 'currency', currency: 'USD' } as const;

    expect(formatNumber(value, locale, options)).to.equal('$1,234.56');
    expect(getFormatter(locale, options)).to.be.instanceOf(Intl.NumberFormat);
  });

  it('should support internal formatNumberMaxPrecision for Number Field', () => {
    const value = 1234.567891234567;
    expect(formatNumberMaxPrecision(value)).to.equal('1,234.567891234567');
  });
});
