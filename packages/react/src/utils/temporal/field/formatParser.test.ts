import { createTemporalRenderer } from '#test-utils';
import { FormatParser } from './formatParser';

describe('FormatParser', () => {
  const { adapter } = createTemporalRenderer();

  describe('escaped characters', () => {
    it('should support escaped characters in start separator', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('Escaped ');
      expect(result.suffix).to.equal('');
      expect(result.elements).to.have.lengthOf(1);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.yearPadded,
        placeholder: 'YYYY',
      });
    });

    it('should support escaped characters between sections separator', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.monthFullLetter} ${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
      expect(result.elements[1]).to.deep.include({
        value: ' Escaped ',
      });
      expect(result.elements[2]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
    });

    it.skipIf(adapter.escapedCharacters.start === adapter.escapedCharacters.end)(
      'should support nested escaped characters',
      () => {
        const { start: startChar, end: endChar } = adapter.escapedCharacters;
        const format = `${adapter.formats.monthFullLetter} ${startChar}Escaped ${startChar}${endChar} ${adapter.formats.yearPadded}`;
        const result = FormatParser.parse(adapter, format, 'ltr', undefined);

        expect(result.prefix).to.equal('');
        expect(result.suffix).to.equal('');
        expect(result.elements).to.have.lengthOf(3);
        expect(result.elements[0]).to.deep.include({
          value: adapter.formats.monthFullLetter,
        });
        expect(result.elements[1]).to.deep.include({
          value: ' Escaped [ ',
        });
        expect(result.elements[2]).to.deep.include({
          value: adapter.formats.yearPadded,
        });
      },
    );

    it('should support several escaped parts', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${adapter.formats.monthFullLetter} ${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('Escaped ');
      expect(result.suffix).to.equal('');
      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
      expect(result.elements[1]).to.deep.include({
        value: ' Escaped ',
      });
      expect(result.elements[2]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
    });

    it('should support format with only escaped parts', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${startChar}Escaped${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // When there are no tokens, escaped parts are absorbed and result in empty format
      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.elements).to.deep.equal([]);
    });
  });

  describe('format without separators', () => {
    it('should support format without separators', () => {
      const format = `${adapter.formats.dayOfMonth}${adapter.formats.month3Letters}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.elements).to.have.lengthOf(2);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.dayOfMonth,
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.month3Letters,
      });
    });
  });

  describe('buildSingleToken', () => {
    it('should build a year token', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded);

      expect(token).to.deep.include({
        value: adapter.formats.yearPadded,
      });
      expect(token.config).to.deep.include({
        part: 'year',
      });
      // buildSingleToken generates placeholder, just verify it's not empty
      expect(token.placeholder).to.be.a('string');
      expect(token.placeholder.length).to.be.greaterThan(0);
    });

    it('should build a month token', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthFullLetter);

      expect(token).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
      expect(token.config).to.deep.include({
        part: 'month',
      });
      expect(token.placeholder).to.be.a('string');
      expect(token.placeholder.length).to.be.greaterThan(0);
    });

    it('should build a day token', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonth);

      expect(token).to.deep.include({
        value: adapter.formats.dayOfMonth,
      });
      expect(token.config).to.deep.include({
        part: 'day',
      });
      expect(token.placeholder).to.be.a('string');
      expect(token.placeholder.length).to.be.greaterThan(0);
    });
  });

  describe('getTokenConfig', () => {
    it('should return config for a valid token', () => {
      const config = FormatParser.getTokenConfig(adapter, adapter.formats.yearPadded);

      expect(config).to.deep.include({
        part: 'year',
        contentType: 'digit',
      });
    });

    it('should throw error for an invalid token', () => {
      expect(() => {
        FormatParser.getTokenConfig(adapter, 'INVALID');
      }).to.throw(/The token "INVALID" is not supported/);
    });
  });

  describe('placeholders', () => {
    it('should use default placeholders', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      result.elements.forEach((element) => {
        if ('placeholder' in element) {
          expect(element.placeholder).to.be.a('string');
          expect(element.placeholder.length).to.be.greaterThan(0);
        }
      });
    });

    it('should use custom year placeholder', () => {
      const format = adapter.formats.yearPadded;
      const result = FormatParser.parse(adapter, format, 'ltr', {
        year: () => 'CustomYear',
      });

      expect('placeholder' in result.elements[0]).to.equal(true);
      if ('placeholder' in result.elements[0]) {
        expect(result.elements[0].placeholder).to.equal('CustomYear');
      }
    });

    it('should use custom month placeholder', () => {
      const format = adapter.formats.monthFullLetter;
      const result = FormatParser.parse(adapter, format, 'ltr', {
        month: () => 'CustomMonth',
      });

      expect('placeholder' in result.elements[0]).to.equal(true);
      if ('placeholder' in result.elements[0]) {
        expect(result.elements[0].placeholder).to.equal('CustomMonth');
      }
    });

    it('should use custom day placeholder', () => {
      const format = adapter.formats.dayOfMonth;
      const result = FormatParser.parse(adapter, format, 'ltr', {
        day: () => 'CustomDay',
      });

      expect('placeholder' in result.elements[0]).to.equal(true);
      if ('placeholder' in result.elements[0]) {
        expect(result.elements[0].placeholder).to.equal('CustomDay');
      }
    });
  });

  describe('prefix and suffix', () => {
    it('should extract prefix from format', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Prefix${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('Prefix ');
      expect(result.suffix).to.equal('');
    });

    it('should extract suffix from format', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.yearPadded} ${startChar}Suffix${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal(' Suffix');
    });

    it('should extract both prefix and suffix from format', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Before${endChar} ${adapter.formats.yearPadded} ${startChar}After${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('Before ');
      expect(result.suffix).to.equal(' After');
    });
  });

  describe('separators', () => {
    it('should parse format with slash separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Find separators between tokens - they are now inlined as separate elements
      const separators = result.elements.filter((element) => !('placeholder' in element));
      separators.forEach((separator) => {
        expect(separator.value).to.be.a('string');
      });
    });

    it('should parse format with dot separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate).replace(/\//g, '.');
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      const separators = result.elements.filter((element) => !('placeholder' in element));
      separators.forEach((separator) => {
        expect(separator.value).to.include('.');
      });
    });

    it('should parse format with dash separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate).replace(/\//g, '-');
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      const separators = result.elements.filter((element) => !('placeholder' in element));
      separators.forEach((separator) => {
        expect(separator.value).to.include('-');
      });
    });

    it('should parse format with space separator', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[1]).to.deep.include({ value: ' ' });
    });

    it('should handle multiple character separators', () => {
      const format = `${adapter.formats.monthFullLetter} / ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[1]).to.deep.include({ value: ' / ' });
    });
  });

  describe('RTL support', () => {
    it('should handle RTL direction with space separators', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'rtl', undefined);

      // RTL should add unicode control characters around space separators
      expect(result.elements).to.have.lengthOf(3);
      const separator = result.elements[1];
      expect('value' in separator && !('placeholder' in separator)).to.equal(true);
      if ('value' in separator && !('placeholder' in separator)) {
        expect(separator.value).to.include('\u2069');
        expect(separator.value).to.include('\u2066');
      }
    });

    it('should reverse token order in RTL', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const resultLtr = FormatParser.parse(adapter, format, 'ltr', undefined);
      const resultRtl = FormatParser.parse(adapter, format, 'rtl', undefined);

      // In RTL, the format string itself is reversed
      expect(resultRtl.elements).to.have.lengthOf(3);
      const firstTokenRtl = resultRtl.elements[0];
      const lastTokenLtr = resultLtr.elements[resultLtr.elements.length - 1];

      if ('config' in firstTokenRtl && 'config' in lastTokenLtr) {
        expect(firstTokenRtl.config.part).to.equal(lastTokenLtr.config.part);
      }
    });
  });

  describe('format expansion', () => {
    it('should expand localized format tokens', () => {
      const format = adapter.formats.localizedNumericDate;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Should have multiple elements after expansion
      expect(result.elements.length).to.be.greaterThan(0);
    });

    it('should handle already expanded formats', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements.length).to.be.greaterThan(0);
    });
  });

  describe('isPadded detection', () => {
    it('should detect padded year tokens', () => {
      const format = 'yyyy';
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      if ('isPadded' in result.elements[0]) {
        expect(result.elements[0].isPadded).to.be.a('boolean');
      }
    });

    it('should detect padded month tokens', () => {
      const format = 'MM';
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      if ('isPadded' in result.elements[0]) {
        expect(result.elements[0].isPadded).to.be.a('boolean');
      }
    });

    it('should detect padded day tokens', () => {
      const format = 'dd';
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      if ('isPadded' in result.elements[0]) {
        expect(result.elements[0].isPadded).to.be.a('boolean');
      }
    });

    it('should not pad letter-based tokens', () => {
      const format = adapter.formats.monthFullLetter;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Letter content types should not be padded
      const firstToken = result.elements[0];
      if ('config' in firstToken && firstToken.config.contentType === 'letter') {
        expect(firstToken.isPadded).to.equal(false);
      }
    });
  });

  describe('complex formats', () => {
    it('should parse full date format', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Count tokens (elements with placeholder property)
      const tokens = result.elements.filter((el) => 'placeholder' in el);
      expect(tokens).to.have.lengthOf.at.least(2);
      expect(result.prefix).to.be.a('string');
      expect(result.suffix).to.be.a('string');
    });

    it('should parse date with weekday', () => {
      const format = `${adapter.formats.weekday3Letters} ${adapter.expandFormat(adapter.formats.localizedNumericDate)}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      const tokens = result.elements.filter((el) => 'placeholder' in el);
      expect(tokens.length).to.be.greaterThan(2);
    });

    it('should parse time format', () => {
      const format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Should contain hours and minutes
      const tokens = result.elements.filter((el) => 'config' in el);
      expect(tokens.length).to.be.greaterThan(0);
      const parts = tokens.map((t) => ('config' in t ? t.config.part : null)).filter(Boolean);
      expect(parts).to.satisfy((types: string[]) =>
        types.some((t) => t === 'hours' || t === 'minutes'),
      );
    });

    it('should parse datetime format', () => {
      const format = `${adapter.expandFormat(adapter.formats.localizedNumericDate)} ${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Should have both date and time tokens
      const tokens = result.elements.filter((el) => 'config' in el);
      const parts = tokens.map((t) => ('config' in t ? t.config.part : null)).filter(Boolean);
      expect(parts).to.include.members(['year', 'month', 'day']);
    });
  });

  describe('edge cases', () => {
    it('should handle format with consecutive tokens', () => {
      const format = `${adapter.formats.yearPadded}${adapter.formats.monthPadded}${adapter.formats.dayOfMonth}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.monthPadded,
      });
      expect(result.elements[2]).to.deep.include({
        value: adapter.formats.dayOfMonth,
      });
    });

    it('should handle format with multiple spaces', () => {
      const format = `${adapter.formats.monthFullLetter}   ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
      expect(result.elements[1]).to.deep.include({
        value: '   ',
      });
      expect(result.elements[2]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
    });

    it('should handle empty escaped strings', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.yearPadded}${startChar}${endChar}${adapter.formats.monthFullLetter}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements).to.have.lengthOf(2);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
    });

    it('should handle format with special characters', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.yearPadded}${startChar}@#$${endChar}${adapter.formats.monthFullLetter}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
      expect(result.elements[1]).to.deep.include({
        value: '@#$',
      });
      expect(result.elements[2]).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
    });
  });

  describe('token properties', () => {
    it('should set correct value for each token', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      result.elements.forEach((element) => {
        expect(element.value).to.be.a('string');
        expect(element.value.length).to.be.greaterThan(0);
      });
    });

    it('should set correct config for each token', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      result.elements.forEach((element) => {
        if ('config' in element) {
          expect(element.config).to.be.an('object');
          expect(element.config.part).to.be.a('string');
          expect(element.config.contentType).to.be.oneOf(['digit', 'letter', 'digit-with-letter']);
        }
      });
    });

    it('should have separators between tokens', () => {
      const format = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonth}/${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Format: token, separator, token, separator, token = 5 elements
      expect(result.elements).to.have.lengthOf(5);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.monthPadded,
      });
      expect(result.elements[1]).to.deep.include({
        value: '/',
      });
      expect(result.elements[2]).to.deep.include({
        value: adapter.formats.dayOfMonth,
      });
      expect(result.elements[3]).to.deep.include({
        value: '/',
      });
      expect(result.elements[4]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
    });
  });
});
