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

    it('parses percentages by default', () => {
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

    it('parses percentages with Arabic numerals', () => {
      expect(parseNumber('١٢٪')).to.equal(0.12);
    });

    it('parses percentages with Han numerals', () => {
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
      // Last '.' is decimal; previous '.' are removed
      expect(parseNumber('1.234.567.89')).to.equal(1234567.89);
    });

    it('parses number with mixed separators (FR)', () => {
      expect(parseNumber('1.234.567,89', 'fr-FR')).to.equal(1234567.89);
    });

    it('parses number with mixed separators (US)', () => {
      expect(parseNumber('1.234.567,89', 'en-US')).to.equal(1234.56789);
    });

    it('returns null for empty and whitespace-only input', () => {
      expect(parseNumber('')).to.equal(null);
      expect(parseNumber('   ')).to.equal(null);
    });

    it('returns null for just a sign', () => {
      expect(parseNumber('-')).to.equal(null);
      expect(parseNumber('+')).to.equal(null);
    });

    it('handles ASCII leading and trailing signs', () => {
      expect(parseNumber('+1234')).to.equal(1234);
      expect(parseNumber('1234+')).to.equal(1234);
      expect(parseNumber('-1234')).to.equal(-1234);
      expect(parseNumber('1234-')).to.equal(-1234);
    });

    it('supports multiple unicode minus variants', () => {
      expect(parseNumber('‒123')).to.equal(-123); // figure dash
      expect(parseNumber('–123')).to.equal(-123); // en dash
      expect(parseNumber('—123')).to.equal(-123); // em dash
      expect(parseNumber('－123')).to.equal(-123); // fullwidth hyphen-minus
      expect(parseNumber('﹣123')).to.equal(-123); // small hyphen-minus
    });

    it('supports additional unicode plus variants', () => {
      expect(parseNumber('﹢123')).to.equal(123); // small plus sign
    });

    it('handles additional percent symbol variants', () => {
      expect(parseNumber('12％')).to.equal(0.12); // fullwidth percent
      expect(parseNumber('12﹪')).to.equal(0.12); // small percent
      expect(parseNumber('12٪')).to.equal(0.12); // Arabic percent sign with ASCII digits
    });

    it('parses Arabic punctuation with ASCII digits', () => {
      expect(parseNumber('1٬234٫56')).to.equal(1234.56);
    });

    it('removes various Unicode space groupings (fr-FR)', () => {
      expect(parseNumber('1\u202F234,56', 'fr-FR')).to.equal(1234.56); // narrow no-break space
      expect(parseNumber('1\u2009234,56', 'fr-FR')).to.equal(1234.56); // thin space
      expect(parseNumber('1\u2007234,56', 'fr-FR')).to.equal(1234.56); // figure space
      expect(parseNumber('1\u00A0234,56', 'fr-FR')).to.equal(1234.56); // no-break space
    });

    it('handles Swiss grouping apostrophe', () => {
      // de-CH uses RIGHT SINGLE QUOTATION MARK (U+2019) as group separator on some platforms and straight apostrophe on others
      expect(parseNumber('1’234.56', 'de-CH')).to.equal(1234.56);
      expect(parseNumber("1'234.56", 'de-CH')).to.equal(1234.56);
    });

    it('parses de-DE formatted numbers', () => {
      expect(parseNumber('1.234,56', 'de-DE')).to.equal(1234.56);
      expect(parseNumber('1.234.567,89', 'de-DE')).to.equal(1234567.89);
    });

    it('parses currency prefix/suffix across locales', () => {
      const en = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(
        1234.56,
      );
      const fr = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
        1234.56,
      );
      expect(parseNumber(en, 'en-US', { style: 'currency', currency: 'EUR' })).to.equal(1234.56);
      expect(parseNumber(fr, 'fr-FR', { style: 'currency', currency: 'EUR' })).to.equal(1234.56);
    });

    it('parses units with different formats', () => {
      expect(
        parseNumber('12 km/h', 'en-US', { style: 'unit', unit: 'kilometer-per-hour' }),
      ).to.equal(12);
      expect(parseNumber('12 m/s', 'en-US', { style: 'unit', unit: 'meter-per-second' })).to.equal(
        12,
      );
    });

    it('treats bidi/format controls as ignorable in the middle of input', () => {
      expect(parseNumber('1\u202A234\u202C.56')).to.equal(1234.56); // LRE...PDF
      expect(parseNumber('\u202A12\u202C%')).to.equal(0.12);
    });

    it('returns null for Infinity with explicit sign and surrounding spaces', () => {
      expect(parseNumber(' +Infinity ')).to.equal(null);
      expect(parseNumber(' -∞ ')).to.equal(null);
      expect(parseNumber('+Infinity')).to.equal(null);
    });

    it('collapses multiple consecutive dots keeping only the last as decimal', () => {
      expect(parseNumber('1..5')).to.equal(1.5);
      expect(parseNumber('123..456..789.01')).to.equal(123456789.01);
      expect(parseNumber('....5')).to.equal(0.5);
    });
  });
});
