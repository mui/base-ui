import { expect } from 'chai';
import { NumberField } from '@base-ui-components/react/number-field';

describe('NumberField exported utilities', () => {
  it('should expose formatting utilities', () => {
    const value = 1234.56;
    const locale = 'en-US';
    const options = { style: 'currency', currency: 'USD' } as const;

    expect(NumberField.formatNumber(value, locale, options)).to.equal('$1,234.56');
    expect(NumberField.formatNumberMaxPrecision(value)).to.equal('1,234.56');
    expect(NumberField.getFormatter(locale, options)).to.be.instanceOf(Intl.NumberFormat);
  });
});
