import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import {
  getLetterEditingOptions,
  cleanDigitDatePartValue,
  mergeDateIntoReferenceDate,
} from './utils';
import { TemporalFieldStore } from './TemporalFieldStore';
import { createDefaultStoreParameters } from './TemporalFieldStore.test-utils';
import { dateFieldConfig } from '../root/dateFieldConfig';
import { timeFieldConfig } from '../../time-field/root/timeFieldConfig';
import { selectors } from './selectors';
import { FormatParser } from './formatParser';
import { LocalizedDigits } from './adapter-cache';

function buildLocalizedDigits(digits: string[]): LocalizedDigits {
  const toLocalized = new Map<string, string>();
  const fromLocalized = new Map<string, string>();
  for (let i = 0; i < digits.length; i += 1) {
    toLocalized.set(i.toString(), digits[i]);
    fromLocalized.set(digits[i], i.toString());
  }
  return { toLocalized, fromLocalized };
}

const ARABIC_INDIC_DIGITS = buildLocalizedDigits([
  '٠',
  '١',
  '٢',
  '٣',
  '٤',
  '٥',
  '٦',
  '٧',
  '٨',
  '٩',
]);
const EASTERN_ARABIC_INDIC_DIGITS = buildLocalizedDigits([
  '۰',
  '۱',
  '۲',
  '۳',
  '۴',
  '۵',
  '۶',
  '۷',
  '۸',
  '۹',
]);

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

      const result = cleanDigitDatePartValue(adapter, 5, null, token);
      expect(result).to.equal('5');
    });

    it('should format a padded value with leading zeros', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, null, token);
      expect(result).to.equal('05');
    });

    it('should handle single-digit values without padding', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonth, {});

      const result = cleanDigitDatePartValue(adapter, 3, null, token);
      expect(result).to.equal('3');
    });

    it('should handle double-digit values with padding', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.dayOfMonthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 15, null, token);
      expect(result).to.equal('15');
    });
  });

  describe('padded values', () => {
    it('should pad year values correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded, {});

      const result = cleanDigitDatePartValue(adapter, 2023, null, token);
      expect(result).to.equal('2023');
    });

    it('should pad hours correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded, {});

      const result = cleanDigitDatePartValue(adapter, 9, null, token);
      expect(result).to.equal('09');
    });

    it('should pad minutes correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.minutesPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, null, token);
      expect(result).to.equal('05');
    });

    it('should pad seconds correctly', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.secondsPadded, {});

      const result = cleanDigitDatePartValue(adapter, 7, null, token);
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

    it('should skip localization when localizedDigits is null (standard ASCII)', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.monthPadded, {});

      const result = cleanDigitDatePartValue(adapter, 5, null, token);
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

      expect(cleanDigitDatePartValue(adapter, 1, null, token)).to.equal('1st');
      expect(cleanDigitDatePartValue(adapter, 2, null, token)).to.equal('2nd');
      expect(cleanDigitDatePartValue(adapter, 3, null, token)).to.equal('3rd');
      expect(cleanDigitDatePartValue(adapter, 15, null, token)).to.equal('15th');
    });

    it('should format days 4-9 with "th" suffix', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      expect(cleanDigitDatePartValue(adapter, 4, null, token)).to.equal('4th');
      expect(cleanDigitDatePartValue(adapter, 5, null, token)).to.equal('5th');
      expect(cleanDigitDatePartValue(adapter, 6, null, token)).to.equal('6th');
      expect(cleanDigitDatePartValue(adapter, 7, null, token)).to.equal('7th');
      expect(cleanDigitDatePartValue(adapter, 8, null, token)).to.equal('8th');
      expect(cleanDigitDatePartValue(adapter, 9, null, token)).to.equal('9th');
    });

    it('should format 11th, 12th, 13th with "th" suffix (not st/nd/rd)', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      // These are exceptions - even though they end in 1, 2, 3
      expect(cleanDigitDatePartValue(adapter, 11, null, token)).to.equal('11th');
      expect(cleanDigitDatePartValue(adapter, 12, null, token)).to.equal('12th');
      expect(cleanDigitDatePartValue(adapter, 13, null, token)).to.equal('13th');
    });

    it('should format 21st, 22nd, 23rd, 31st with special suffixes', () => {
      const token = FormatParser.buildSingleToken(
        adapter,
        adapter.formats.dayOfMonthWithLetter,
        {},
      );

      expect(cleanDigitDatePartValue(adapter, 21, null, token)).to.equal('21st');
      expect(cleanDigitDatePartValue(adapter, 22, null, token)).to.equal('22nd');
      expect(cleanDigitDatePartValue(adapter, 23, null, token)).to.equal('23rd');
      expect(cleanDigitDatePartValue(adapter, 31, null, token)).to.equal('31st');
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded, {});

      const result = cleanDigitDatePartValue(adapter, 0, null, token);
      expect(result).to.equal('00');
    });

    it('should handle maximum boundary value', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.hours24hPadded, {});

      const result = cleanDigitDatePartValue(adapter, 23, null, token);
      expect(result).to.equal('23');
    });

    it('should handle 4-digit year with full padding', () => {
      const token = FormatParser.buildSingleToken(adapter, adapter.formats.yearPadded, {});

      const result = cleanDigitDatePartValue(adapter, 50, null, token);
      expect(result).to.equal('0050');
    });

    it('should handle 2-digit year', () => {
      // 2-digit year format - not in adapter.formats
      const token = FormatParser.buildSingleToken(adapter, 'yy', {});

      const result = cleanDigitDatePartValue(adapter, 5, null, token);
      expect(result).to.equal('05');
    });
  });
});

describe('mergeDateIntoReferenceDate', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  // Time formats
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}:${adapter.formats.secondsPadded}`;
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  const DEFAULT_PARAMETERS = createDefaultStoreParameters(adapter, numericDateFormat);

  describe('transferring date parts', () => {
    it('should transfer year from source to reference date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2030-06-20', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(5); // June = 5 (0-indexed)
      expect(adapter.getDate(result)).to.equal(20);
    });

    it('should transfer month from source to reference date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-09-15', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
    });

    it('should transfer day from source to reference date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getDate(result)).to.equal(25);
    });

    it('should transfer hours from source to reference date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time24Format,
          defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        },
        timeFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-15T09:30:45', 'default');
      const reference = adapter.date('2024-03-15T14:30:45', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getHours(result)).to.equal(9);
    });

    it('should transfer minutes from source to reference date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time24Format,
          defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        },
        timeFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-15T14:55:45', 'default');
      const reference = adapter.date('2024-03-15T14:30:45', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getMinutes(result)).to.equal(55);
    });

    it('should transfer seconds from source to reference date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time24Format,
          defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        },
        timeFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-15T14:30:10', 'default');
      const reference = adapter.date('2024-03-15T14:30:45', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getSeconds(result)).to.equal(10);
    });
  });

  describe('shouldLimitToEditedSections', () => {
    it('should transfer all date parts when shouldLimitToEditedSections is false', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
      expect(adapter.getDate(result)).to.equal(25);
    });

    it('should only transfer modified sections when shouldLimitToEditedSections is true', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state).map((section) => {
        if ('token' in section && section.token.config.part === 'month') {
          return { ...section, modified: true };
        }
        return { ...section, modified: false };
      });

      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, true);

      // Only month should be transferred from source
      expect(adapter.getYear(result)).to.equal(2024); // unchanged from reference
      expect(adapter.getMonth(result)).to.equal(8); // September = 8, transferred from source
      expect(adapter.getDate(result)).to.equal(15); // unchanged from reference
    });

    it('should not transfer any sections when none are modified and shouldLimitToEditedSections is true', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors
        .sections(store.state)
        .map((section) => ({ ...section, modified: false }));

      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, true);

      // Nothing should be transferred; result should match reference
      expect(adapter.getYear(result)).to.equal(2024);
      expect(adapter.getMonth(result)).to.equal(2); // March = 2 (0-indexed)
      expect(adapter.getDate(result)).to.equal(15);
    });
  });

  describe('meridiem transfer', () => {
    it('should convert PM reference to AM when source is AM', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time12Format,
          defaultValue: adapter.date('2024-03-15T08:30:00', 'default'),
        },
        timeFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-15T08:30:00', 'default'); // 8 AM
      const reference = adapter.date('2024-03-15T20:30:00', 'default'); // 8 PM

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getHours(result)).to.equal(8); // converted from PM to AM
    });

    it('should convert AM reference to PM when source is PM', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time12Format,
          defaultValue: adapter.date('2024-03-15T20:30:00', 'default'),
        },
        timeFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-15T20:30:00', 'default'); // 8 PM
      const reference = adapter.date('2024-03-15T08:30:00', 'default'); // 8 AM

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getHours(result)).to.equal(20); // converted from AM to PM
    });

    it('should leave hours unchanged when meridiem matches', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time12Format,
          defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        },
        timeFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2024-03-15T14:30:00', 'default'); // 2 PM
      const reference = adapter.date('2024-03-15T16:45:00', 'default'); // 4 PM

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      // Hours are transferred from source (14), and meridiem matches (both PM), so no adjustment
      expect(adapter.getHours(result)).to.equal(14);
    });
  });

  describe('section filtering', () => {
    it('should skip separator sections', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state);

      // Verify that there are separator sections in the format (MM/DD/YYYY has 2 separators)
      const separatorCount = sections.filter(
        (s) => !('token' in s) || s.token.config.part === undefined,
      ).length;
      expect(separatorCount).to.be.greaterThan(0);

      // Despite separators, the function should work correctly
      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
      expect(adapter.getDate(result)).to.equal(25);
    });

    it('should process sections in granularity order regardless of input order', () => {
      // The numericDateFormat is MM/DD/YYYY, so month comes before year in the sections array.
      // The function sorts by DATE_PART_GRANULARITY, so year (1) should be processed before month (2) before day (3).
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const sections = selectors.sections(store.state);
      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(source, sections, reference, false);

      // All parts should be correctly transferred despite the section order (month first, then day, then year)
      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
      expect(adapter.getDate(result)).to.equal(25);
    });
  });
});
