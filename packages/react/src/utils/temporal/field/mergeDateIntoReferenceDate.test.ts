import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../time-field/root/TimeFieldStore';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';
import { TemporalFieldSectionPlugin } from './plugins/TemporalFieldSectionPlugin';

describe('mergeDateIntoReferenceDate', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  // Time formats
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}:${adapter.formats.secondsPadded}`;
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  describe('transferring date parts', () => {
    it('should transfer year from source to reference date', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2030-06-20', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(5); // June = 5 (0-indexed)
      expect(adapter.getDate(result)).to.equal(20);
    });

    it('should transfer month from source to reference date', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-09-15', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
    });

    it('should transfer day from source to reference date', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getDate(result)).to.equal(25);
    });

    it('should transfer hours from source to reference date', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-15T09:30:45', 'default');
      const reference = adapter.date('2024-03-15T14:30:45', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getHours(result)).to.equal(9);
    });

    it('should transfer minutes from source to reference date', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-15T14:55:45', 'default');
      const reference = adapter.date('2024-03-15T14:30:45', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getMinutes(result)).to.equal(55);
    });

    it('should transfer seconds from source to reference date', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-15T14:30:10', 'default');
      const reference = adapter.date('2024-03-15T14:30:45', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getSeconds(result)).to.equal(10);
    });
  });

  describe('shouldLimitToEditedSections', () => {
    it('should transfer all date parts when shouldLimitToEditedSections is false', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
      expect(adapter.getDate(result)).to.equal(25);
    });

    it('should only transfer modified sections when shouldLimitToEditedSections is true', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state).map(
        (section, index) => {
          if ('token' in section && section.token.config.part === 'month') {
            return { ...section, modified: true };
          }
          return { ...section, modified: false };
        },
      );

      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, true);

      // Only month should be transferred from source
      expect(adapter.getYear(result)).to.equal(2024); // unchanged from reference
      expect(adapter.getMonth(result)).to.equal(8); // September = 8, transferred from source
      expect(adapter.getDate(result)).to.equal(15); // unchanged from reference
    });

    it('should not transfer any sections when none are modified and shouldLimitToEditedSections is true', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state).map(
        (section) => ({ ...section, modified: false }),
      );

      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, true);

      // Nothing should be transferred; result should match reference
      expect(adapter.getYear(result)).to.equal(2024);
      expect(adapter.getMonth(result)).to.equal(2); // March = 2 (0-indexed)
      expect(adapter.getDate(result)).to.equal(15);
    });
  });

  describe('meridiem transfer', () => {
    it('should convert PM reference to AM when source is AM', () => {
      const store = new TimeFieldStore({
        format: time12Format,
        defaultValue: adapter.date('2024-03-15T08:30:00', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-15T08:30:00', 'default'); // 8 AM
      const reference = adapter.date('2024-03-15T20:30:00', 'default'); // 8 PM

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getHours(result)).to.equal(8); // converted from PM to AM
    });

    it('should convert AM reference to PM when source is PM', () => {
      const store = new TimeFieldStore({
        format: time12Format,
        defaultValue: adapter.date('2024-03-15T20:30:00', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-15T20:30:00', 'default'); // 8 PM
      const reference = adapter.date('2024-03-15T08:30:00', 'default'); // 8 AM

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getHours(result)).to.equal(20); // converted from AM to PM
    });

    it('should leave hours unchanged when meridiem matches', () => {
      const store = new TimeFieldStore({
        format: time12Format,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2024-03-15T14:30:00', 'default'); // 2 PM
      const reference = adapter.date('2024-03-15T16:45:00', 'default'); // 4 PM

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      // Hours are transferred from source (14), and meridiem matches (both PM), so no adjustment
      expect(adapter.getHours(result)).to.equal(14);
    });
  });

  describe('section filtering', () => {
    it('should skip separator sections', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);

      // Verify that there are separator sections in the format (MM/DD/YYYY has 2 separators)
      const separatorCount = sections.filter((s) => !('token' in s) || s.token.config.part === undefined).length;
      expect(separatorCount).to.be.greaterThan(0);

      // Despite separators, the function should work correctly
      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
      expect(adapter.getDate(result)).to.equal(25);
    });

    it('should process sections in granularity order regardless of input order', () => {
      // The numericDateFormat is MM/DD/YYYY, so month comes before year in the sections array.
      // The function sorts by DATE_PART_GRANULARITY, so year (1) should be processed before month (2) before day (3).
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const sections = TemporalFieldSectionPlugin.selectors.sections(store.state);
      const source = adapter.date('2030-09-25', 'default');
      const reference = adapter.date('2024-03-15', 'default');

      const result = mergeDateIntoReferenceDate(adapter, source, sections, reference, false);

      // All parts should be correctly transferred despite the section order (month first, then day, then year)
      expect(adapter.getYear(result)).to.equal(2030);
      expect(adapter.getMonth(result)).to.equal(8); // September = 8 (0-indexed)
      expect(adapter.getDate(result)).to.equal(25);
    });
  });
});
