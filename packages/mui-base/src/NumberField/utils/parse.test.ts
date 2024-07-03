import { expect } from 'chai';
import { getNumberLocaleDetails, parseNumber } from './parse';

describe.skip('NumberField parse', () => {
  describe('getNumberLocaleDetails', () => {
    it('returns the number locale details', () => {
      const details = getNumberLocaleDetails();
      expect(details.decimal).to.equal('.');
      expect(details.group).to.equal(',');
      expect(details.currency).to.equal(undefined);
      expect(details.percent).to.equal(undefined);
      expect(details.unit).to.equal(undefined);
      expect(details.code).to.equal(undefined);
    });
  });

  describe('parseNumber', () => {
    it('parses a number', () => {
      expect(parseNumber('1,234.56')).to.equal(1234.56);
    });

    it('parses a number with different options', () => {
      expect(parseNumber('12%')).to.equal(0.12);
    });

    it('parses a number with Arabic numerals', function test() {
      // Skip in browser as it doesn't support Arabic numerals.
      if (!/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }
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
