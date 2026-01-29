import { createTemporalRenderer } from '#test-utils';
import { getLetterEditingOptions, cleanDigitDatePartValue } from './utils';
import { FormatParser } from './formatParser';

const STANDARD_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const EASTERN_ARABIC_INDIC_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

describe('getLetterEditingOptions', () => {
  const { adapter } = createTemporalRenderer();

  describe('month section', () => {
    it('should return abbreviated month names', () => {
      const result = getLetterEditingOptions(adapter, 'month', adapter.formats.month3Letters);

      expect(result).to.deep.equal([
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]);
    });

    it('should return full month names', () => {
      const result = getLetterEditingOptions(adapter, 'month', adapter.formats.monthFullLetter);

      expect(result).to.deep.equal([
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]);
    });
  });

  describe('weekDay section', () => {
    it('should return abbreviated weekday names', () => {
      const result = getLetterEditingOptions(adapter, 'weekDay', adapter.formats.weekday3Letters);

      expect(result).to.deep.equal(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('should return full weekday names', () => {
      const result = getLetterEditingOptions(adapter, 'weekDay', adapter.formats.weekday);

      expect(result).to.deep.equal([
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]);
    });
  });

  describe('meridiem section', () => {
    it('should return AM and PM', () => {
      const result = getLetterEditingOptions(adapter, 'meridiem', adapter.formats.meridiem);

      expect(result).to.deep.equal(['AM', 'PM']);
    });
  });

  describe('unsupported section types', () => {
    it('should return empty array for year section', () => {
      const result = getLetterEditingOptions(adapter, 'year', adapter.formats.yearPadded);

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for day section', () => {
      const result = getLetterEditingOptions(adapter, 'day', adapter.formats.dayOfMonthPadded);

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for hours section', () => {
      const result = getLetterEditingOptions(adapter, 'hours', adapter.formats.hours24hPadded);

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for minutes section', () => {
      const result = getLetterEditingOptions(adapter, 'minutes', adapter.formats.minutesPadded);

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for seconds section', () => {
      const result = getLetterEditingOptions(adapter, 'seconds', adapter.formats.secondsPadded);

      expect(result).to.deep.equal([]);
    });
  });
});

describe('cleanDigitSectionValue', () => {
  const { adapter } = createTemporalRenderer();

  describe('basic digit formatting', () => {
    it('should format a simple unpadded value', () => {
      // Unpadded month format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'M', {});

      const result = cleanDigitDatePartValue(adapter, 5, STANDARD_DIGITS, token);
      expect(result).to.equal('5');
    });

    it('should format a padded value with leading zeros', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });

    it('should handle single-digit values without padding', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonth, {});

      const result = cleanDigitDatePartValue(adapter, 3, STANDARD_DIGITS, token);
      expect(result).to.equal('3');
    });

    it('should handle double-digit values with padding', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 15, STANDARD_DIGITS, token);
      expect(result).to.equal('15');
    });
  });

  describe('padded values', () => {
    it('should pad year values correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded, {});

      const result = cleanDigitDatePartValue(adapter, 2023, STANDARD_DIGITS, token);
      expect(result).to.equal('2023');
    });

    it('should pad hours correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded, {});

      const result = cleanDigitDatePartValue(adapter, 9, STANDARD_DIGITS, token);
      expect(result).to.equal('09');
    });

    it('should pad minutes correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.minutesPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });

    it('should pad seconds correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.secondsPadded, {});

      const result = cleanDigitDatePartValue(adapter, 7, STANDARD_DIGITS, token);
      expect(result).to.equal('07');
    });
  });

  describe('localized digits', () => {
    it('should convert to Arabic-Indic digits', () => {
      // Unpadded month format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'M', {});

      const result = cleanDigitDatePartValue(adapter, 5, ARABIC_INDIC_DIGITS, token);
      expect(result).to.equal('٥');
    });

    it('should convert padded values to localized digits', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, ARABIC_INDIC_DIGITS, token);
      expect(result).to.equal('٠٥');
    });

    it('should handle Eastern Arabic-Indic digits', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 15, EASTERN_ARABIC_INDIC_DIGITS, token);
      expect(result).to.equal('۱۵');
    });

    it('should skip localization when digits start with 0', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });
  });

  describe('digit-with-letter format for days', () => {
    it('should format day with ordinal suffix', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      expect(cleanDigitDatePartValue(adapter, 1, STANDARD_DIGITS, token)).to.equal('1st');
      expect(cleanDigitDatePartValue(adapter, 2, STANDARD_DIGITS, token)).to.equal('2nd');
      expect(cleanDigitDatePartValue(adapter, 3, STANDARD_DIGITS, token)).to.equal('3rd');
      expect(cleanDigitDatePartValue(adapter, 15, STANDARD_DIGITS, token)).to.equal('15th');
    });

    it('should format days 4-9 with "th" suffix', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      expect(cleanDigitDatePartValue(adapter, 4, STANDARD_DIGITS, token)).to.equal('4th');
      expect(cleanDigitDatePartValue(adapter, 5, STANDARD_DIGITS, token)).to.equal('5th');
      expect(cleanDigitDatePartValue(adapter, 6, STANDARD_DIGITS, token)).to.equal('6th');
      expect(cleanDigitDatePartValue(adapter, 7, STANDARD_DIGITS, token)).to.equal('7th');
      expect(cleanDigitDatePartValue(adapter, 8, STANDARD_DIGITS, token)).to.equal('8th');
      expect(cleanDigitDatePartValue(adapter, 9, STANDARD_DIGITS, token)).to.equal('9th');
    });

    it('should format 11th, 12th, 13th with "th" suffix (not st/nd/rd)', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      // These are exceptions - even though they end in 1, 2, 3
      expect(cleanDigitDatePartValue(adapter, 11, STANDARD_DIGITS, token)).to.equal('11th');
      expect(cleanDigitDatePartValue(adapter, 12, STANDARD_DIGITS, token)).to.equal('12th');
      expect(cleanDigitDatePartValue(adapter, 13, STANDARD_DIGITS, token)).to.equal('13th');
    });

    it('should format 21st, 22nd, 23rd, 31st with special suffixes', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      expect(cleanDigitDatePartValue(adapter, 21, STANDARD_DIGITS, token)).to.equal('21st');
      expect(cleanDigitDatePartValue(adapter, 22, STANDARD_DIGITS, token)).to.equal('22nd');
      expect(cleanDigitDatePartValue(adapter, 23, STANDARD_DIGITS, token)).to.equal('23rd');
      expect(cleanDigitDatePartValue(adapter, 31, STANDARD_DIGITS, token)).to.equal('31st');
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded, {});

      const result = cleanDigitDatePartValue(adapter, 0, STANDARD_DIGITS, token);
      expect(result).to.equal('00');
    });

    it('should handle maximum boundary value', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded, {});

      const result = cleanDigitDatePartValue(adapter, 23, STANDARD_DIGITS, token);
      expect(result).to.equal('23');
    });

    it('should handle 4-digit year with full padding', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded, {});

      const result = cleanDigitDatePartValue(adapter, 50, STANDARD_DIGITS, token);
      expect(result).to.equal('0050');
    });

    it('should handle 2-digit year', () => {
      // 2-digit year format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'yy', {});

      const result = cleanDigitDatePartValue(adapter, 5, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });
  });
});
