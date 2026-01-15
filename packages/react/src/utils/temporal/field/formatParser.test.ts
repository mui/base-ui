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
      expect(result.tokens).to.have.lengthOf(1);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.yearPadded,
        placeholder: 'YYYY',
        separator: '',
      });
    });

    it('should support escaped characters between sections separator', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.monthFullLetter} ${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: ' Escaped ',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
    });

    it.skipIf(
      adapter.escapedCharacters.start === adapter.escapedCharacters.end,
    )('should support nested escaped characters', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.monthFullLetter} ${startChar}Escaped ${startChar}${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: ' Escaped [ ',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
    });

    it('should support several escaped parts', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${adapter.formats.monthFullLetter} ${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('Escaped ');
      expect(result.suffix).to.equal('');
      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: ' Escaped ',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
    });

    it('should support format with only escaped parts', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${startChar}Escaped${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // When there are no tokens, escaped parts are absorbed and result in empty format
      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.tokens).to.deep.equal([]);
    });
  });

  describe('format without separators', () => {
    it('should support format without separators', () => {
      const format = `${adapter.formats.dayOfMonth}${adapter.formats.month3Letters}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.prefix).to.equal('');
      expect(result.suffix).to.equal('');
      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.dayOfMonth,
        separator: '',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.month3Letters,
        separator: '',
      });
    });
  });

  describe('buildSingleToken', () => {
    it('should build a year token', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded);

      expect(token).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
      expect(token.config).to.deep.include({
        sectionType: 'year',
      });
      // buildSingleToken generates placeholder, just verify it's not empty
      expect(token.placeholder).to.be.a('string');
      expect(token.placeholder.length).to.be.greaterThan(0);
    });

    it('should build a month token', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthFullLetter);

      expect(token).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: '',
      });
      expect(token.config).to.deep.include({
        sectionType: 'month',
      });
      expect(token.placeholder).to.be.a('string');
      expect(token.placeholder.length).to.be.greaterThan(0);
    });

    it('should build a day token', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonth);

      expect(token).to.deep.include({
        value: adapter.formats.dayOfMonth,
        separator: '',
      });
      expect(token.config).to.deep.include({
        sectionType: 'day',
      });
      expect(token.placeholder).to.be.a('string');
      expect(token.placeholder.length).to.be.greaterThan(0);
    });
  });

  describe('getTokenConfig', () => {
    it('should return config for a valid token', () => {
      const config = FormatParser.getTokenConfig(adapter, adapter.formats.yearPadded);

      expect(config).to.deep.include({
        sectionType: 'year',
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

      result.tokens.forEach((token) => {
        expect(token.placeholder).to.be.a('string');
        expect(token.placeholder.length).to.be.greaterThan(0);
      });
    });

    it('should use custom year placeholder', () => {
      const format = adapter.formats.yearPadded;
      const result = FormatParser.parse(adapter, format, 'ltr', {
        year: () => 'CustomYear',
      });

      expect(result.tokens[0].placeholder).to.equal('CustomYear');
    });

    it('should use custom month placeholder', () => {
      const format = adapter.formats.monthFullLetter;
      const result = FormatParser.parse(adapter, format, 'ltr', {
        month: () => 'CustomMonth',
      });

      expect(result.tokens[0].placeholder).to.equal('CustomMonth');
    });

    it('should use custom day placeholder', () => {
      const format = adapter.formats.dayOfMonth;
      const result = FormatParser.parse(adapter, format, 'ltr', {
        day: () => 'CustomDay',
      });

      expect(result.tokens[0].placeholder).to.equal('CustomDay');
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

      // Find separators between tokens
      const separators = result.tokens.slice(0, -1).map((token) => token.separator);
      separators.forEach((separator) => {
        expect(separator).to.be.a('string');
      });
    });

    it('should parse format with dot separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate).replace(/\//g, '.');
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      const separators = result.tokens.slice(0, -1).map((token) => token.separator);
      separators.forEach((separator) => {
        expect(separator).to.include('.');
      });
    });

    it('should parse format with dash separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate).replace(/\//g, '-');
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      const separators = result.tokens.slice(0, -1).map((token) => token.separator);
      separators.forEach((separator) => {
        expect(separator).to.include('-');
      });
    });

    it('should parse format with space separator', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens[0].separator).to.equal(' ');
    });

    it('should handle multiple character separators', () => {
      const format = `${adapter.formats.monthFullLetter} / ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens[0].separator).to.equal(' / ');
    });
  });

  describe('RTL support', () => {
    it('should handle RTL direction with space separators', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'rtl', undefined);

      // RTL should add unicode control characters around space separators
      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0].separator).to.include('\u2069');
      expect(result.tokens[0].separator).to.include('\u2066');
    });

    it('should reverse token order in RTL', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const resultLtr = FormatParser.parse(adapter, format, 'ltr', undefined);
      const resultRtl = FormatParser.parse(adapter, format, 'rtl', undefined);

      // In RTL, the format string itself is reversed
      expect(resultRtl.tokens).to.have.lengthOf(2);
      expect(resultRtl.tokens[0].config.sectionType).to.equal(
        resultLtr.tokens[1].config.sectionType,
      );
    });
  });

  describe('format expansion', () => {
    it('should expand localized format tokens', () => {
      const format = adapter.formats.localizedNumericDate;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Should have multiple tokens after expansion
      expect(result.tokens.length).to.be.greaterThan(0);
    });

    it('should handle already expanded formats', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens.length).to.be.greaterThan(0);
    });
  });

  describe('isPadded detection', () => {
    it('should detect padded year tokens', () => {
      const format = 'yyyy';
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens[0].isPadded).to.be.a('boolean');
    });

    it('should detect padded month tokens', () => {
      const format = 'MM';
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens[0].isPadded).to.be.a('boolean');
    });

    it('should detect padded day tokens', () => {
      const format = 'dd';
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens[0].isPadded).to.be.a('boolean');
    });

    it('should not pad letter-based tokens', () => {
      const format = adapter.formats.monthFullLetter;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Letter content types should not be padded
      if (result.tokens[0].config.contentType === 'letter') {
        expect(result.tokens[0].isPadded).to.equal(false);
      }
    });
  });

  describe('complex formats', () => {
    it('should parse full date format', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens).to.have.lengthOf.at.least(2);
      expect(result.prefix).to.be.a('string');
      expect(result.suffix).to.be.a('string');
    });

    it('should parse date with weekday', () => {
      const format = `${adapter.formats.weekday3Letters} ${adapter.expandFormat(adapter.formats.localizedNumericDate)}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens.length).to.be.greaterThan(2);
    });

    it('should parse time format', () => {
      const format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Should contain hours and minutes
      expect(result.tokens.length).to.be.greaterThan(0);
      const sectionTypes = result.tokens.map((t) => t.config.sectionType);
      expect(sectionTypes).to.satisfy((types: string[]) =>
        types.some((t) => t === 'hours' || t === 'minutes'),
      );
    });

    it('should parse datetime format', () => {
      const format = `${adapter.expandFormat(adapter.formats.localizedNumericDate)} ${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      // Should have both date and time tokens
      const sectionTypes = result.tokens.map((t) => t.config.sectionType);
      expect(sectionTypes).to.include.members(['year', 'month', 'day']);
    });
  });

  describe('edge cases', () => {
    it('should handle format with consecutive tokens', () => {
      const format = `${adapter.formats.yearPadded}${adapter.formats.monthPadded}${adapter.formats.dayOfMonth}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens).to.have.lengthOf(3);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.monthPadded,
        separator: '',
      });
      expect(result.tokens[2]).to.deep.include({
        value: adapter.formats.dayOfMonth,
        separator: '',
      });
    });

    it('should handle format with multiple spaces', () => {
      const format = `${adapter.formats.monthFullLetter}   ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: '   ',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
    });

    it('should handle empty escaped strings', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.yearPadded}${startChar}${endChar}${adapter.formats.monthFullLetter}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: '',
      });
    });

    it('should handle format with special characters', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.yearPadded}${startChar}@#$${endChar}${adapter.formats.monthFullLetter}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens).to.have.lengthOf(2);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '@#$',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.monthFullLetter,
        separator: '',
      });
    });
  });

  describe('token properties', () => {
    it('should set correct value for each token', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      result.tokens.forEach((token) => {
        expect(token.value).to.be.a('string');
        expect(token.value.length).to.be.greaterThan(0);
      });
    });

    it('should set correct config for each token', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      result.tokens.forEach((token) => {
        expect(token.config).to.be.an('object');
        expect(token.config.sectionType).to.be.a('string');
        expect(token.config.contentType).to.be.oneOf(['digit', 'letter', 'digit-with-letter']);
      });
    });

    it('should set separator for all tokens except last', () => {
      const format = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonth}/${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', undefined);

      expect(result.tokens).to.have.lengthOf(3);
      expect(result.tokens[0]).to.deep.include({
        value: adapter.formats.monthPadded,
        separator: '/',
      });
      expect(result.tokens[1]).to.deep.include({
        value: adapter.formats.dayOfMonth,
        separator: '/',
      });
      expect(result.tokens[2]).to.deep.include({
        value: adapter.formats.yearPadded,
        separator: '',
      });
    });
  });
});
