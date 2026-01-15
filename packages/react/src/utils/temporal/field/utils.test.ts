import { createTemporalRenderer } from '#test-utils';
import { getDaysInWeekStr, getLetterEditingOptions, cleanDigitSectionValue } from './utils';
import { TemporalFieldSectionValueBoundaries } from './types';
import { FormatParser } from './formatParser';

const STANDARD_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const EASTERN_ARABIC_INDIC_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

describe('getDaysInWeekStr', () => {
  const { adapter } = createTemporalRenderer();

  it('should return abbreviated weekday names', () => {
    const result = getDaysInWeekStr(adapter, adapter.formats.weekday3Letters);

    expect(result).to.deep.equal(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('should return full weekday names', () => {
    const result = getDaysInWeekStr(adapter, adapter.formats.weekday);

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

  it('should return single-letter weekday names', () => {
    const result = getDaysInWeekStr(adapter, adapter.formats.weekday1Letter);

    expect(result).to.deep.equal(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });
});

describe('getLetterEditingOptions', () => {
  const { adapter } = createTemporalRenderer();

  describe('month section', () => {
    it('should return abbreviated month names', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'month',
        adapter.formats.month3Letters,
      );

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
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'month',
        adapter.formats.monthFullLetter,
      );

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
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'weekDay',
        adapter.formats.weekday3Letters,
      );

      expect(result).to.deep.equal(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('should return full weekday names', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'weekDay',
        adapter.formats.weekday,
      );

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
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'meridiem',
        adapter.formats.meridiem,
      );

      expect(result).to.deep.equal(['AM', 'PM']);
    });
  });

  describe('unsupported section types', () => {
    it('should return empty array for year section', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'year',
        adapter.formats.yearPadded,
      );

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for day section', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'day',
        adapter.formats.dayOfMonthPadded,
      );

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for hours section', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'hours',
        adapter.formats.hours24hPadded,
      );

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for minutes section', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'minutes',
        adapter.formats.minutesPadded,
      );

      expect(result).to.deep.equal([]);
    });

    it('should return empty array for seconds section', () => {
      const result = getLetterEditingOptions(
        adapter,
        'default',
        'seconds',
        adapter.formats.secondsPadded,
      );

      expect(result).to.deep.equal([]);
    });
  });
});

describe('cleanDigitSectionValue', () => {
  const { adapter } = createTemporalRenderer();

  describe('basic digit formatting', () => {
    it('should format a simple unpadded value', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'month'> = {
        minimum: 1,
        maximum: 12,
      };
      // Unpadded month format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'M');

      const result = cleanDigitSectionValue(adapter, 5, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('5');
    });

    it('should format a padded value with leading zeros', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'month'> = {
        minimum: 1,
        maximum: 12,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded);

      const result = cleanDigitSectionValue(adapter, 5, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });

    it('should handle single-digit values without padding', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'day'> = {
        minimum: 1,
        maximum: 31,
        longestMonth: adapter.date('2020-01-01', 'default'),
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonth);

      const result = cleanDigitSectionValue(adapter, 3, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('3');
    });

    it('should handle double-digit values with padding', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'day'> = {
        minimum: 1,
        maximum: 31,
        longestMonth: adapter.date('2020-01-01', 'default'),
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonthPadded);

      const result = cleanDigitSectionValue(adapter, 15, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('15');
    });
  });

  describe('padded values', () => {
    it('should pad year values correctly', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'year'> = {
        minimum: 1,
        maximum: 9999,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded);

      const result = cleanDigitSectionValue(adapter, 2023, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('2023');
    });

    it('should pad hours correctly', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'hours'> = {
        minimum: 0,
        maximum: 23,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded);

      const result = cleanDigitSectionValue(adapter, 9, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('09');
    });

    it('should pad minutes correctly', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'minutes'> = {
        minimum: 0,
        maximum: 59,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.minutesPadded);

      const result = cleanDigitSectionValue(adapter, 5, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });

    it('should pad seconds correctly', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'seconds'> = {
        minimum: 0,
        maximum: 59,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.secondsPadded);

      const result = cleanDigitSectionValue(adapter, 7, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('07');
    });
  });

  describe('localized digits', () => {
    it('should convert to Arabic-Indic digits', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'month'> = {
        minimum: 1,
        maximum: 12,
      };
      // Unpadded month format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'M');

      const result = cleanDigitSectionValue(adapter, 5, boundaries, ARABIC_INDIC_DIGITS, token);
      expect(result).to.equal('٥');
    });

    it('should convert padded values to localized digits', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'month'> = {
        minimum: 1,
        maximum: 12,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded);

      const result = cleanDigitSectionValue(adapter, 5, boundaries, ARABIC_INDIC_DIGITS, token);
      expect(result).to.equal('٠٥');
    });

    it('should handle Eastern Arabic-Indic digits', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'day'> = {
        minimum: 1,
        maximum: 31,
        longestMonth: adapter.date('2020-01-01', 'default'),
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonthPadded);

      const result = cleanDigitSectionValue(
        adapter,
        15,
        boundaries,
        EASTERN_ARABIC_INDIC_DIGITS,
        token,
      );
      expect(result).to.equal('۱۵');
    });

    it('should skip localization when digits start with 0', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'month'> = {
        minimum: 1,
        maximum: 12,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded);

      const result = cleanDigitSectionValue(adapter, 5, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });
  });

  describe('digit-with-letter format for days', () => {
    it('should format day with ordinal suffix', () => {
      const longestMonth = adapter.date('2020-01-01', 'default');
      const boundaries: TemporalFieldSectionValueBoundaries<'day'> = {
        minimum: 1,
        maximum: 31,
        longestMonth,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonthWithLetter);

      expect(cleanDigitSectionValue(adapter, 1, boundaries, STANDARD_DIGITS, token)).to.equal(
        '1st',
      );
      expect(cleanDigitSectionValue(adapter, 2, boundaries, STANDARD_DIGITS, token)).to.equal(
        '2nd',
      );
      expect(cleanDigitSectionValue(adapter, 3, boundaries, STANDARD_DIGITS, token)).to.equal(
        '3rd',
      );
      expect(cleanDigitSectionValue(adapter, 15, boundaries, STANDARD_DIGITS, token)).to.equal(
        '15th',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'hours'> = {
        minimum: 0,
        maximum: 23,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded);

      const result = cleanDigitSectionValue(adapter, 0, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('00');
    });

    it('should handle maximum boundary value', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'hours'> = {
        minimum: 0,
        maximum: 23,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded);

      const result = cleanDigitSectionValue(adapter, 23, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('23');
    });

    it('should handle 4-digit year with full padding', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'year'> = {
        minimum: 1,
        maximum: 9999,
      };
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded);

      const result = cleanDigitSectionValue(adapter, 50, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('0050');
    });

    it('should handle 2-digit year', () => {
      const boundaries: TemporalFieldSectionValueBoundaries<'year'> = {
        minimum: 0,
        maximum: 99,
      };
      // 2-digit year format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'yy');

      const result = cleanDigitSectionValue(adapter, 5, boundaries, STANDARD_DIGITS, token);
      expect(result).to.equal('05');
    });
  });
});
