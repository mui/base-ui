import { expect } from 'chai';
import {
  formatNumber,
  formatNumberMaxPrecision,
  getFormatter,
} from '@base-ui-components/react/utils';

describe('Base UI exported utilities', () => {
  it('should expose formatting utilities', () => {
    const value = 1234.56;
    const locale = 'en-US';
    const options = { style: 'currency', currency: 'USD' } as const;

    expect(formatNumber(value, locale, options)).to.equal('$1,234.56');
    expect(formatNumberMaxPrecision(value)).to.equal('1,234.56');
    expect(getFormatter(locale, options)).to.be.instanceOf(Intl.NumberFormat);
  });
});
