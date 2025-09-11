import { expect } from 'chai';
import { getNumberLocaleDetails, parseNumber } from './parse';

describe('NumberField parse', () => {
  describe('getNumberLocaleDetails', () => {
    it('returns the number locale details', () => {
      const details = getNumberLocaleDetails('en-US');
      expect(details.decimal).to.equal('.');
      expect(details.group).to.equal(',');
      expect(details.currency).to.equal(undefined);
      expect(details.percent).to.equal(undefined);
      expect(details.unit).to.equal(undefined);
    });
  });

  describe('parseNumber', () => {
    it('parses a number', () => {
      const numberString = new Intl.NumberFormat().format(1234.56);
      expect(parseNumber(numberString)).to.equal(1234.56);
    });

    it('parses a number with different options', () => {
      expect(parseNumber('12%')).to.equal(0.12);
    });

    it('parses a number with Arabic numerals', ({ skip }) => {
      // Skip in browser as it doesn't support Arabic numerals.
      skip();
      expect(parseNumber('١٬٢٣٤٫٥٦')).to.equal(1234.56);
    });

    it('parses a number with Han numerals', () => {
      expect(parseNumber('一,二三四.五六')).to.equal(1234.56);
    });

    it('parses a number with different options and Arabic numerals', () => {
      expect(parseNumber('١٢٪')).to.equal(0.12);
    });

    it('parses a number with different options and Han numerals', () => {
      expect(parseNumber('一二%')).to.equal(0.12);
    });

    it('returns null for an invalid number', () => {
      expect(parseNumber('invalid')).to.equal(null);
    });

    it('handles percentages with style: "percent"', () => {
      expect(parseNumber('12%', 'en-US', { style: 'percent' })).to.equal(0.12);
    });

    it('handles percentages with style: "unit" and unit: "percent"', () => {
      expect(parseNumber('12%', 'en-US', { style: 'unit', unit: 'percent' })).to.equal(12);
    });

    it('parses fullwidth digits and punctuation', () => {
      expect(parseNumber('１，２３４．５６')).to.equal(1234.56);
      expect(parseNumber('１２％')).to.equal(0.12);
    });

    it('parses Persian digits', () => {
      expect(parseNumber('۱۲۳۴')).to.equal(1234);
      expect(parseNumber('۱۲٫۳۴')).to.equal(12.34);
      expect(parseNumber('۱۲٪')).to.equal(0.12);
    });

    it('parses Persian digits with Arabic thousands and decimal characters', () => {
      // Uses Persian digits + Arabic separators (common in copied text)
      expect(parseNumber('۱۲٬۳۴۵٫۶۷')).to.equal(12345.67);
    });

    it('parses permille values', () => {
      expect(parseNumber('12‰')).to.equal(0.012);
      expect(parseNumber('12؉')).to.equal(0.012);
    });

    it('strips bidi/control characters', () => {
      expect(parseNumber('1\u200E234.56')).to.equal(1234.56);
      expect(parseNumber('\u200E12\u200F%')).to.equal(0.12);
    });

    it('handles unicode minus and plus signs', () => {
      expect(parseNumber('−1234')).to.equal(-1234);
      expect(parseNumber('1234−')).to.equal(-1234);
      expect(parseNumber('＋1234')).to.equal(1234);
      expect(parseNumber('1234＋')).to.equal(1234);
    });

    it('handles parentheses for negative numbers', () => {
      expect(parseNumber('(1,234.5)')).to.equal(-1234.5);
      expect(parseNumber('(12%)')).to.equal(-0.12);
    });

    it('parses french formatted numbers with narrow no-break space grouping', () => {
      const fr = new Intl.NumberFormat('fr-FR').format(1234.5); // e.g., '1 234,5'
      expect(parseNumber(fr, 'fr-FR')).to.equal(1234.5);
      expect(parseNumber(`${fr}−`, 'fr-FR')).to.equal(-1234.5);
    });

    it('parses currency when options specify currency style', () => {
      expect(parseNumber('$1,234.56', 'en-US', { style: 'currency', currency: 'USD' })).to.equal(
        1234.56,
      );
    });

    it('parses units when options specify unit style', () => {
      expect(parseNumber('12 kg', 'en-US', { style: 'unit', unit: 'kilogram' })).to.equal(12);
    });

    it('returns null for Infinity-like inputs', () => {
      expect(parseNumber('Infinity')).to.equal(null);
      expect(parseNumber('-Infinity')).to.equal(null);
      expect(parseNumber('∞')).to.equal(null);
    });

    it('collapses extra dots from mixed-locale inputs', () => {
      // First '.' is decimal; subsequent '.' are removed
      expect(parseNumber('1.234.567.89')).to.equal(1234567.89);
    });
  });
});
