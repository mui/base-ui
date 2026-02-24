import { createTemporalRenderer } from '#test-utils';
import { FormatParser } from './formatParser';
import { enUS } from '../../translations/enUS';

describe('FormatParser', () => {
  const { adapter } = createTemporalRenderer();

  describe('escaped characters', () => {
    it('should support escaped characters in start separator', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(2);
      expect(result.elements[0]).to.deep.include({
        type: 'separator',
        value: 'Escaped ',
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.yearPadded,
        placeholder: 'YYYY',
      });
    });

    it('should support escaped characters between sections separator', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.monthFullLetter} ${startChar}Escaped${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(4);
      expect(result.elements[0]).to.deep.include({
        type: 'separator',
        value: 'Escaped ',
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.monthFullLetter,
      });
      expect(result.elements[2]).to.deep.include({
        value: ' Escaped ',
      });
      expect(result.elements[3]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
    });

    it('should support format with only escaped parts', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Escaped${endChar} ${startChar}Escaped${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      // When there are no tokens, escaped parts are absorbed and result in empty format
      expect(result.elements).to.deep.equal([]);
    });
  });

  describe('format without separators', () => {
    it('should support format without separators', () => {
      const format = `${adapter.formats.dayOfMonth}${adapter.formats.month3Letters}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded, {});

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
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthFullLetter, {});

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
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonth, {});

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
      }).to.throw(/Some token in the format is not supported/);
    });
  });

  describe('placeholders', () => {
    it('should use default placeholders', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      result.elements.forEach((element) => {
        if ('placeholder' in element) {
          expect(element.placeholder).to.be.a('string');
          expect(element.placeholder.length).to.be.greaterThan(0);
        }
      });
    });

    it('should use custom year placeholder', () => {
      const format = adapter.formats.yearPadded;
      const result = FormatParser.parse(
        adapter,
        format,
        'ltr',
        { ...enUS, temporalFieldYearPlaceholder: () => 'CustomYear' },
        {},
      );

      expect('placeholder' in result.elements[0]).to.equal(true);
      if ('placeholder' in result.elements[0]) {
        expect(result.elements[0].placeholder).to.equal('CustomYear');
      }
    });

    it('should use custom month placeholder', () => {
      const format = adapter.formats.monthFullLetter;
      const result = FormatParser.parse(
        adapter,
        format,
        'ltr',
        { ...enUS, temporalFieldMonthPlaceholder: () => 'CustomMonth' },
        {},
      );

      expect('placeholder' in result.elements[0]).to.equal(true);
      if ('placeholder' in result.elements[0]) {
        expect(result.elements[0].placeholder).to.equal('CustomMonth');
      }
    });

    it('should use custom day placeholder', () => {
      const format = adapter.formats.dayOfMonth;
      const result = FormatParser.parse(
        adapter,
        format,
        'ltr',
        { ...enUS, temporalFieldDayPlaceholder: () => 'CustomDay' },
        {},
      );

      expect('placeholder' in result.elements[0]).to.equal(true);
      if ('placeholder' in result.elements[0]) {
        expect(result.elements[0].placeholder).to.equal('CustomDay');
      }
    });
  });

  describe('prefix and suffix', () => {
    it('should include prefix as the first separator element', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Prefix${endChar} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(2);
      expect(result.elements[0]).to.deep.include({
        type: 'separator',
        value: 'Prefix ',
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
    });

    it('should include suffix as the last separator element', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${adapter.formats.yearPadded} ${startChar}Suffix${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(2);
      expect(result.elements[0]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
      expect(result.elements[1]).to.deep.include({
        type: 'separator',
        value: ' Suffix',
      });
    });

    it('should include both prefix and suffix as separator elements', () => {
      const { start: startChar, end: endChar } = adapter.escapedCharacters;
      const format = `${startChar}Before${endChar} ${adapter.formats.yearPadded} ${startChar}After${endChar}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[0]).to.deep.include({
        type: 'separator',
        value: 'Before ',
      });
      expect(result.elements[1]).to.deep.include({
        value: adapter.formats.yearPadded,
      });
      expect(result.elements[2]).to.deep.include({
        type: 'separator',
        value: ' After',
      });
    });
  });

  describe('separators', () => {
    it('should parse format with slash separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      // Find separators between tokens - they are now inlined as separate elements
      const separators = result.elements.filter((element) => !('placeholder' in element));
      separators.forEach((separator) => {
        expect(separator.value).to.be.a('string');
      });
    });

    it('should parse format with dot separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate).replace(/\//g, '.');
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      const separators = result.elements.filter((element) => !('placeholder' in element));
      separators.forEach((separator) => {
        expect(separator.value).to.include('.');
      });
    });

    it('should parse format with dash separator', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate).replace(/\//g, '-');
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      const separators = result.elements.filter((element) => !('placeholder' in element));
      separators.forEach((separator) => {
        expect(separator.value).to.include('-');
      });
    });

    it('should parse format with space separator', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[1]).to.deep.include({ value: ' ' });
    });

    it('should handle multiple character separators', () => {
      const format = `${adapter.formats.monthFullLetter} / ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements).to.have.lengthOf(3);
      expect(result.elements[1]).to.deep.include({ value: ' / ' });
    });
  });

  describe('RTL support', () => {
    it('should handle RTL direction with space separators', () => {
      const format = `${adapter.formats.monthFullLetter} ${adapter.formats.yearPadded}`;
      const result = FormatParser.parse(adapter, format, 'rtl', enUS, {});

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
      const resultLtr = FormatParser.parse(adapter, format, 'ltr', enUS, {});
      const resultRtl = FormatParser.parse(adapter, format, 'rtl', enUS, {});

      // In RTL, the format string itself is reversed
      expect(resultRtl.elements).to.have.lengthOf(3);
      const firstTokenRtl = resultRtl.elements[0];
      const lastTokenLtr = resultLtr.elements[resultLtr.elements.length - 1];

      expect('config' in firstTokenRtl).to.equal(true);
      expect('config' in lastTokenLtr).to.equal(true);
      if ('config' in firstTokenRtl && 'config' in lastTokenLtr) {
        expect(firstTokenRtl.config.part).to.equal(lastTokenLtr.config.part);
      }
    });
  });

  describe('format expansion', () => {
    it('should expand localized format tokens', () => {
      const format = adapter.formats.localizedNumericDate;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      // Should have multiple elements after expansion
      expect(result.elements.length).to.be.greaterThan(0);
    });

    it('should handle already expanded formats', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect(result.elements.length).to.be.greaterThan(0);
    });
  });

  describe('isPadded detection', () => {
    it('should detect padded year tokens', () => {
      const format = 'yyyy';
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect('isPadded' in result.elements[0]).to.equal(true);
      expect((result.elements[0] as any).isPadded).to.be.a('boolean');
    });

    it('should detect padded month tokens', () => {
      const format = 'MM';
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect('isPadded' in result.elements[0]).to.equal(true);
      expect((result.elements[0] as any).isPadded).to.be.a('boolean');
    });

    it('should detect padded day tokens', () => {
      const format = 'dd';
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      expect('isPadded' in result.elements[0]).to.equal(true);
      expect((result.elements[0] as any).isPadded).to.be.a('boolean');
    });

    it('should not pad letter-based tokens', () => {
      const format = adapter.formats.monthFullLetter;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      const firstToken = result.elements[0];
      expect('config' in firstToken).to.equal(true);
      expect((firstToken as any).config.contentType).to.equal('letter');
      expect((firstToken as any).isPadded).to.equal(false);
    });

    it('should handle digit-with-letter format (ordinal)', () => {
      const format = adapter.formats.dayOfMonthWithLetter; // 'do'
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      const firstToken = result.elements[0];
      expect('config' in firstToken).to.equal(true);
      expect((firstToken as any).config.contentType).to.equal('digit-with-letter');
      // isPadded is true because "1st".length > 1, but this is not zero-padding
      expect((firstToken as any).isPadded).to.equal(true);
      // maxLength is the digit count only (strips non-digits like "th", "st", etc.)
      // For days, max is 31, so maxLength is 2
      expect((firstToken as any).maxLength).to.equal(2);
    });
  });

  describe('complex formats', () => {
    it('should parse full date format', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      // Count tokens (elements with placeholder property)
      const tokens = result.elements.filter((el) => 'placeholder' in el);
      expect(tokens).to.have.lengthOf.at.least(2);
    });

    it('should parse date with weekday', () => {
      const format = `${adapter.formats.weekday3Letters} ${adapter.expandFormat(adapter.formats.localizedNumericDate)}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      const tokens = result.elements.filter((el) => 'placeholder' in el);
      expect(tokens.length).to.be.greaterThan(2);
    });

    it('should parse time format', () => {
      const format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      // Should have both date and time tokens
      const tokens = result.elements.filter((el) => 'config' in el);
      const parts = tokens.map((t) => ('config' in t ? t.config.part : null)).filter(Boolean);
      expect(parts).to.include.members(['year', 'month', 'day']);
    });
  });

  describe('edge cases', () => {
    it('should handle format with consecutive tokens', () => {
      const format = `${adapter.formats.yearPadded}${adapter.formats.monthPadded}${adapter.formats.dayOfMonth}`;
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

      result.elements.forEach((element) => {
        expect(element.value).to.be.a('string');
        expect(element.value.length).to.be.greaterThan(0);
      });
    });

    it('should set correct config for each token', () => {
      const format = adapter.expandFormat(adapter.formats.localizedNumericDate);
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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
      const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

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

  describe('boundaries', () => {
    describe('without validation props', () => {
      it('should return default year boundaries', () => {
        const format = adapter.formats.yearPadded;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 9999 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 9999 });
        }
      });

      it('should return default month boundaries', () => {
        const format = adapter.formats.monthPadded;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 1, maximum: 12 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 1, maximum: 12 });
        }
      });

      it('should return default day boundaries', () => {
        const format = adapter.formats.dayOfMonth;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 1, maximum: 31 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 1, maximum: 31 });
        }
      });

      it('should return default hours boundaries (24h)', () => {
        const format = adapter.formats.hours24hPadded;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 23 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 23 });
        }
      });

      it('should return default minutes boundaries', () => {
        const format = adapter.formats.minutesPadded;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 59 });
        }
      });

      it('should return default seconds boundaries', () => {
        const format = adapter.formats.secondsPadded;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 59 });
        }
      });

      it('should return default meridiem boundaries', () => {
        const format = adapter.formats.meridiem;
        const result = FormatParser.parse(adapter, format, 'ltr', enUS, {});

        const token = result.elements[0];
        expect('boundaries' in token).to.equal(true);
        if ('boundaries' in token) {
          expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 1 });
          expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 1 });
        }
      });
    });

    describe('with validation props', () => {
      describe('year adjustment boundaries with minDate/maxDate', () => {
        it('should restrict year adjustment boundaries to minDate/maxDate years', () => {
          const format = adapter.formats.yearPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2020-01-01', 'default'),
            maxDate: adapter.date('2025-12-31', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            // characterEditing should remain unchanged
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 9999 });
            // adjustment should be restricted
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 2020, maximum: 2025 });
          }
        });

        it('should only restrict adjustment minimum when only minDate is provided', () => {
          const format = adapter.formats.yearPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2020-01-01', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 9999 });
            expect(token.boundaries.adjustment.minimum).to.equal(2020);
            expect(token.boundaries.adjustment.maximum).to.equal(9999);
          }
        });

        it('should only restrict adjustment maximum when only maxDate is provided', () => {
          const format = adapter.formats.yearPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            maxDate: adapter.date('2025-12-31', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 9999 });
            expect(token.boundaries.adjustment.minimum).to.equal(0);
            expect(token.boundaries.adjustment.maximum).to.equal(2025);
          }
        });
      });

      describe('month adjustment boundaries with minDate/maxDate', () => {
        it('should restrict month adjustment boundaries when minDate and maxDate share the same year', () => {
          const format = adapter.formats.monthPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-03-01', 'default'),
            maxDate: adapter.date('2024-10-31', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 1, maximum: 12 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 3, maximum: 10 });
          }
        });

        it('should not restrict month adjustment boundaries when minDate and maxDate have different years', () => {
          const format = adapter.formats.monthPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2023-03-01', 'default'),
            maxDate: adapter.date('2024-10-31', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 1, maximum: 12 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 1, maximum: 12 });
          }
        });
      });

      describe('day adjustment boundaries with minDate/maxDate', () => {
        it('should restrict day adjustment boundaries when minDate and maxDate share the same month', () => {
          const format = adapter.formats.dayOfMonth;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-05', 'default'),
            maxDate: adapter.date('2024-06-25', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 1, maximum: 31 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 5, maximum: 25 });
          }
        });

        it('should not restrict day adjustment boundaries when minDate and maxDate have different months', () => {
          const format = adapter.formats.dayOfMonth;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-05-05', 'default'),
            maxDate: adapter.date('2024-06-25', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 1, maximum: 31 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 1, maximum: 31 });
          }
        });
      });

      describe('hours adjustment boundaries with minDate/maxDate', () => {
        it('should restrict hours adjustment boundaries when minDate and maxDate share the same day', () => {
          const format = adapter.formats.hours24hPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T08:00:00', 'default'),
            maxDate: adapter.date('2024-06-15T18:00:00', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 23 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 8, maximum: 18 });
          }
        });

        it('should not restrict hours adjustment boundaries when minDate and maxDate have different days', () => {
          const format = adapter.formats.hours24hPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-14T08:00:00', 'default'),
            maxDate: adapter.date('2024-06-15T18:00:00', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 23 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 23 });
          }
        });
      });

      describe('minutes adjustment boundaries with minDate/maxDate', () => {
        it('should restrict minutes adjustment boundaries when minDate and maxDate share the same hour', () => {
          const format = adapter.formats.minutesPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T14:10:00', 'default'),
            maxDate: adapter.date('2024-06-15T14:50:00', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 10, maximum: 50 });
          }
        });

        it('should not restrict minutes adjustment boundaries when minDate and maxDate have different hours', () => {
          const format = adapter.formats.minutesPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T13:10:00', 'default'),
            maxDate: adapter.date('2024-06-15T14:50:00', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 59 });
          }
        });
      });

      describe('seconds adjustment boundaries with minDate/maxDate', () => {
        it('should restrict seconds adjustment boundaries when minDate and maxDate share the same minute', () => {
          const format = adapter.formats.secondsPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T14:30:05', 'default'),
            maxDate: adapter.date('2024-06-15T14:30:45', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 5, maximum: 45 });
          }
        });

        it('should not restrict seconds adjustment boundaries when minDate and maxDate have different minutes', () => {
          const format = adapter.formats.secondsPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T14:29:05', 'default'),
            maxDate: adapter.date('2024-06-15T14:30:45', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 59 });
          }
        });

        it('should not restrict seconds adjustment boundaries when minDate and maxDate have different hours', () => {
          const format = adapter.formats.secondsPadded;
          const result = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T13:30:05', 'default'),
            maxDate: adapter.date('2024-06-15T14:30:45', 'default'),
          });

          const token = result.elements[0];
          expect('boundaries' in token).to.equal(true);
          if ('boundaries' in token) {
            expect(token.boundaries.characterEditing).to.deep.equal({ minimum: 0, maximum: 59 });
            expect(token.boundaries.adjustment).to.deep.equal({ minimum: 0, maximum: 59 });
          }
        });
      });

      describe('characterEditing is never affected by validation props', () => {
        it('should not change characterEditing for year even with minDate/maxDate', () => {
          const format = adapter.formats.yearPadded;
          const resultWithout = FormatParser.parse(adapter, format, 'ltr', enUS, {});
          const resultWith = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2020-01-01', 'default'),
            maxDate: adapter.date('2025-12-31', 'default'),
          });

          if ('boundaries' in resultWithout.elements[0] && 'boundaries' in resultWith.elements[0]) {
            expect(resultWith.elements[0].boundaries.characterEditing).to.deep.equal(
              resultWithout.elements[0].boundaries.characterEditing,
            );
          }
        });

        it('should not change characterEditing for month even with minDate/maxDate', () => {
          const format = adapter.formats.monthPadded;
          const resultWithout = FormatParser.parse(adapter, format, 'ltr', enUS, {});
          const resultWith = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-03-01', 'default'),
            maxDate: adapter.date('2024-10-31', 'default'),
          });

          if ('boundaries' in resultWithout.elements[0] && 'boundaries' in resultWith.elements[0]) {
            expect(resultWith.elements[0].boundaries.characterEditing).to.deep.equal(
              resultWithout.elements[0].boundaries.characterEditing,
            );
          }
        });

        it('should not change characterEditing for day even with minDate/maxDate', () => {
          const format = adapter.formats.dayOfMonth;
          const resultWithout = FormatParser.parse(adapter, format, 'ltr', enUS, {});
          const resultWith = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-05', 'default'),
            maxDate: adapter.date('2024-06-25', 'default'),
          });

          if ('boundaries' in resultWithout.elements[0] && 'boundaries' in resultWith.elements[0]) {
            expect(resultWith.elements[0].boundaries.characterEditing).to.deep.equal(
              resultWithout.elements[0].boundaries.characterEditing,
            );
          }
        });

        it('should not change characterEditing for hours even with minDate/maxDate', () => {
          const format = adapter.formats.hours24hPadded;
          const resultWithout = FormatParser.parse(adapter, format, 'ltr', enUS, {});
          const resultWith = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T08:00:00', 'default'),
            maxDate: adapter.date('2024-06-15T18:00:00', 'default'),
          });

          if ('boundaries' in resultWithout.elements[0] && 'boundaries' in resultWith.elements[0]) {
            expect(resultWith.elements[0].boundaries.characterEditing).to.deep.equal(
              resultWithout.elements[0].boundaries.characterEditing,
            );
          }
        });

        it('should not change characterEditing for minutes even with minDate/maxDate', () => {
          const format = adapter.formats.minutesPadded;
          const resultWithout = FormatParser.parse(adapter, format, 'ltr', enUS, {});
          const resultWith = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T14:10:00', 'default'),
            maxDate: adapter.date('2024-06-15T14:50:00', 'default'),
          });

          if ('boundaries' in resultWithout.elements[0] && 'boundaries' in resultWith.elements[0]) {
            expect(resultWith.elements[0].boundaries.characterEditing).to.deep.equal(
              resultWithout.elements[0].boundaries.characterEditing,
            );
          }
        });

        it('should not change characterEditing for seconds even with minDate/maxDate', () => {
          const format = adapter.formats.secondsPadded;
          const resultWithout = FormatParser.parse(adapter, format, 'ltr', enUS, {});
          const resultWith = FormatParser.parse(adapter, format, 'ltr', enUS, {
            minDate: adapter.date('2024-06-15T14:30:05', 'default'),
            maxDate: adapter.date('2024-06-15T14:30:45', 'default'),
          });

          if ('boundaries' in resultWithout.elements[0] && 'boundaries' in resultWith.elements[0]) {
            expect(resultWith.elements[0].boundaries.characterEditing).to.deep.equal(
              resultWithout.elements[0].boundaries.characterEditing,
            );
          }
        });
      });
    });
  });
});
