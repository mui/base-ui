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

    it('parses a number with Arabic numerals', function test(t = {}) {
      // Skip in browser as it doesn't support Arabic numerals.
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
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
  });
});
