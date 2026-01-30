import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../../time-field/root/TimeFieldStore';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';

describe('TemporalFieldSectionPlugin', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const yearOnlyFormat = adapter.formats.yearPadded;
  const monthOnlyFormat = adapter.formats.monthPadded;

  // Time formats
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
  const hourOnlyFormat = adapter.formats.hours24hPadded;

  describe('clearActive', () => {
    it('should clear the active section when it has a value', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0); // month section

      const datePart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('03'); // Month is set

      store.section.clearActive();

      const updatedDatePart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(updatedDatePart!.value).to.equal(''); // Month is cleared
    });

    it('should not do anything when active section is already empty', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0); // month section (empty)

      const datePart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal(''); // Already empty

      store.section.clearActive(); // Should not error

      const updatedDatePart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(updatedDatePart!.value).to.equal(''); // Still empty
    });

    it('should clear day section and preserve month/year', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(2); // day section

      store.section.clearActive();

      // Day should be cleared
      const dayPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
      expect(dayPart!.value).to.equal('');

      // Month and year should remain
      const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(monthPart!.value).to.equal('03');

      const yearPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
      expect(yearPart!.value).to.equal('2024');
    });

    it('should clear all sections sequentially', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Clear month
      store.section.selectClosestDatePart(0);
      store.section.clearActive();
      const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(monthPart!.value).to.equal('');

      // Clear day
      store.section.selectClosestDatePart(2);
      store.section.clearActive();
      const dayPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
      expect(dayPart!.value).to.equal('');

      // Clear year
      store.section.selectClosestDatePart(4);
      store.section.clearActive();
      const yearPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
      expect(yearPart!.value).to.equal('');

      // All sections should be empty
      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(value).to.equal(null);
    });

    it('should reset character query when clearing section', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0); // month section

      // Start typing
      store.characterEditing.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Clear the section
      store.section.clearActive();

      // Type again - should start fresh query
      store.characterEditing.editSection({
        keyPressed: '5',
        sectionIndex: 0,
      });

      const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(monthPart!.value).to.equal('05'); // Should be 05, not trying to concatenate with cleared '0'
    });
  });

  describe('updateFromString', () => {
    it('should parse and update value from valid string', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.value.updateFromString('03/15/2024');

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);
      expect(adapter.getMonth(value!)).to.equal(2); // March = month 2 (0-indexed)
      expect(adapter.getDate(value!)).to.equal(15);
      expect(adapter.getYear(value!)).to.equal(2024);
    });

    it('should parse and update value from valid string when value already exists', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2023-01-01', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.value.updateFromString('12/31/2024');

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);
      expect(adapter.getMonth(value!)).to.equal(11); // December = month 11 (0-indexed)
      expect(adapter.getDate(value!)).to.equal(31);
      expect(adapter.getYear(value!)).to.equal(2024);
    });

    it('should handle invalid string by setting value to null', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.value.updateFromString('invalid date string');

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(value).to.equal(null);
    });

    it('should handle empty string by setting value to null', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.value.updateFromString('');

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(value).to.equal(null);
    });

    it('should parse time string correctly', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        adapter,
        direction: 'ltr',
      });

      store.value.updateFromString('14:30');

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);
      expect(adapter.getHours(value!)).to.equal(14);
      expect(adapter.getMinutes(value!)).to.equal(30);
    });

    it('should reset character query after pasting', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      // Select month section and start typing
      store.section.selectClosestDatePart(0);
      store.characterEditing.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Paste a complete date
      store.value.updateFromString('05/20/2024');

      // Now type in the month section - should not try to concatenate with previous '0'
      store.characterEditing.editSection({
        keyPressed: '7',
        sectionIndex: 0,
      });

      const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(monthPart!.value).to.equal('07'); // Should be 07, not trying to use old query
    });
  });

  describe('preserving non-displayed sections', () => {
    it('should preserve time information when editing date with partial format', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Edit the day
      store.section.selectClosestDatePart(2); // day section
      store.section.updateDatePart({
        sectionIndex: 2,
        newDatePartValue: '20',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Date should be updated
      expect(adapter.getDate(value!)).to.equal(20);

      // Time should be preserved
      expect(adapter.getHours(value!)).to.equal(14);
      expect(adapter.getMinutes(value!)).to.equal(30);
    });

    it('should preserve time information when clearing date then refilling', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Clear day
      store.section.selectClosestDatePart(2);
      store.section.clearActive();

      // Refill day
      store.section.updateDatePart({
        sectionIndex: 2,
        newDatePartValue: '20',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Time should still be preserved
      expect(adapter.getHours(value!)).to.equal(14);
      expect(adapter.getMinutes(value!)).to.equal(30);
    });

    it('should preserve date information when using year-only format', () => {
      const store = new DateFieldStore({
        format: yearOnlyFormat,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Edit the year
      store.section.selectClosestDatePart(0); // year section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '2025',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Year should be updated
      expect(adapter.getYear(value!)).to.equal(2025);

      // Month, day, and time should be preserved
      expect(adapter.getMonth(value!)).to.equal(2); // March
      expect(adapter.getDate(value!)).to.equal(15);
      expect(adapter.getHours(value!)).to.equal(14);
      expect(adapter.getMinutes(value!)).to.equal(30);
    });

    it('should preserve date information when using month-only format', () => {
      const store = new DateFieldStore({
        format: monthOnlyFormat,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Edit the month
      store.section.selectClosestDatePart(0); // month section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '12',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Month should be updated
      expect(adapter.getMonth(value!)).to.equal(11); // December

      // Year, day, and time should be preserved
      expect(adapter.getYear(value!)).to.equal(2024);
      expect(adapter.getDate(value!)).to.equal(15);
      expect(adapter.getHours(value!)).to.equal(14);
      expect(adapter.getMinutes(value!)).to.equal(30);
    });

    it('should preserve date information when editing time with partial format', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Edit the hour
      store.section.selectClosestDatePart(0); // hour section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '18',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Hour should be updated
      expect(adapter.getHours(value!)).to.equal(18);

      // Date should be preserved
      expect(adapter.getYear(value!)).to.equal(2024);
      expect(adapter.getMonth(value!)).to.equal(2); // March
      expect(adapter.getDate(value!)).to.equal(15);
    });

    it('should preserve date information when clearing time then refilling', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        defaultValue: adapter.date('2024-03-15T14:30:00', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Clear hour
      store.section.selectClosestDatePart(0);
      store.section.clearActive();

      // Refill hour
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '18',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Date should still be preserved
      expect(adapter.getYear(value!)).to.equal(2024);
      expect(adapter.getMonth(value!)).to.equal(2); // March
      expect(adapter.getDate(value!)).to.equal(15);
    });

    it('should preserve time sections when using hour-only format', () => {
      const store = new TimeFieldStore({
        format: hourOnlyFormat,
        defaultValue: adapter.date('2024-03-15T14:30:45', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Edit the hour
      store.section.selectClosestDatePart(0); // hour section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '18',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);

      // Hour should be updated
      expect(adapter.getHours(value!)).to.equal(18);

      // Minutes and seconds should be preserved
      expect(adapter.getMinutes(value!)).to.equal(30);
      expect(adapter.getSeconds(value!)).to.equal(45);
    });
  });

  describe('leap year support', () => {
    it('should allow entering February 29th for leap year', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      // Enter 02/29/2024 (2024 is a leap year)
      store.section.selectClosestDatePart(0); // month
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '02',
        shouldGoToNextSection: false,
      });

      store.section.selectClosestDatePart(2); // day
      store.section.updateDatePart({
        sectionIndex: 2,
        newDatePartValue: '29',
        shouldGoToNextSection: false,
      });

      store.section.selectClosestDatePart(4); // year
      store.section.updateDatePart({
        sectionIndex: 4,
        newDatePartValue: '2024',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);
      expect(adapter.getMonth(value!)).to.equal(1); // February = month 1
      expect(adapter.getDate(value!)).to.equal(29);
      expect(adapter.getYear(value!)).to.equal(2024);
    });

    it('should allow updating from non-leap year to leap year February 29th', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2023-02-28', 'default'), // 2023 is not a leap year
        adapter,
        direction: 'ltr',
      });

      // Update year to 2024 (leap year)
      store.section.selectClosestDatePart(4);
      store.section.updateDatePart({
        sectionIndex: 4,
        newDatePartValue: '2024',
        shouldGoToNextSection: false,
      });

      // Update day to 29
      store.section.selectClosestDatePart(2);
      store.section.updateDatePart({
        sectionIndex: 2,
        newDatePartValue: '29',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);
      expect(adapter.getDate(value!)).to.equal(29);
      expect(adapter.getYear(value!)).to.equal(2024);
    });
  });

  describe('year format support', () => {
    it('should support 4-digit year format', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(4); // year (4-digit)
      store.section.updateDatePart({
        sectionIndex: 4,
        newDatePartValue: '2024',
        shouldGoToNextSection: false,
      });

      // Value might be null if other sections are empty, but year section should be filled
      const yearPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
      expect(yearPart!.value).to.equal('2024');
    });

    it('should support 4-digit year format when updating existing value', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2023-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(4);
      store.section.updateDatePart({
        sectionIndex: 4,
        newDatePartValue: '2025',
        shouldGoToNextSection: false,
      });

      const value = TemporalFieldValuePlugin.selectors.value(store.state);
      expect(adapter.isValid(value)).to.equal(true);
      expect(adapter.getYear(value!)).to.equal(2025);
    });
  });

  describe('section navigation', () => {
    it('should select the correct section by index', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0); // month
      expect(store.state.selectedSection).to.equal(0);

      store.section.selectClosestDatePart(2); // day
      expect(store.state.selectedSection).to.equal(2);

      store.section.selectClosestDatePart(4); // year
      expect(store.state.selectedSection).to.equal(4);
    });

    it('should navigate to next section', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0); // month
      expect(store.state.selectedSection).to.equal(0);

      store.section.selectNextDatePart();
      expect(store.state.selectedSection).to.equal(2); // day (skips separator at index 1)

      store.section.selectNextDatePart();
      expect(store.state.selectedSection).to.equal(4); // year (skips separator at index 3)
    });

    it('should navigate to previous section', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(4); // year
      expect(store.state.selectedSection).to.equal(4);

      store.section.selectPreviousDatePart();
      expect(store.state.selectedSection).to.equal(2); // day (skips separator at index 3)

      store.section.selectPreviousDatePart();
      expect(store.state.selectedSection).to.equal(0); // month (skips separator at index 1)
    });

    it('should not navigate past last section', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(4); // year (last section)
      expect(store.state.selectedSection).to.equal(4);

      store.section.selectNextDatePart();
      expect(store.state.selectedSection).to.equal(4); // Should stay at year
    });

    it('should not navigate before first section', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0); // month (first section)
      expect(store.state.selectedSection).to.equal(0);

      store.section.selectPreviousDatePart();
      expect(store.state.selectedSection).to.equal(0); // Should stay at month
    });

    it('should not crash when navigating forward with a trailing separator', () => {
      const { start: esc, end: escEnd } = adapter.escapedCharacters;
      // Format: MM/dd/yyyy. — produces a trailing separator after the last datePart
      const formatWithTrailingSeparator = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}${esc}.${escEnd}`;
      const store = new DateFieldStore({
        format: formatWithTrailingSeparator,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(4); // year (last datePart)
      expect(store.state.selectedSection).to.equal(4);

      // Should not throw and should stay on the current section
      store.section.selectNextDatePart();
      expect(store.state.selectedSection).to.equal(4);
    });

    it('should not crash when navigating backward with a leading separator', () => {
      const { start: esc, end: escEnd } = adapter.escapedCharacters;
      // Format: .MM/dd/yyyy — produces a leading separator before the first datePart
      const formatWithLeadingSeparator = `${esc}.${escEnd}${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
      const store = new DateFieldStore({
        format: formatWithLeadingSeparator,
        adapter,
        direction: 'ltr',
      });

      // The first datePart is at index 1 (index 0 is the leading separator)
      store.section.selectClosestDatePart(1); // month
      expect(store.state.selectedSection).to.equal(1);

      // Should not throw and should stay on the current section
      store.section.selectPreviousDatePart();
      expect(store.state.selectedSection).to.equal(1);
    });

    it('should select the first date part when clicking on a leading separator', () => {
      const { start: esc, end: escEnd } = adapter.escapedCharacters;
      // Format: .MM/dd/yyyy — produces a leading separator before the first datePart
      const formatWithLeadingSeparator = `${esc}.${escEnd}${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
      const store = new DateFieldStore({
        format: formatWithLeadingSeparator,
        adapter,
        direction: 'ltr',
      });

      // Clicking on the leading separator (index 0) should select the first date part (index 1)
      store.section.selectClosestDatePart(0);
      expect(store.state.selectedSection).to.equal(1); // Should select month (first date part)
    });

    it('should remove selected section', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      store.section.selectClosestDatePart(0);
      expect(store.state.selectedSection).to.equal(0);

      store.section.removeSelectedSection();
      expect(store.state.selectedSection).to.equal(null);
    });
  });

  describe('external value changes', () => {
    it.only('should update sections when value is set externally via updateFromString', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Verify initial value
      const initialMonthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(initialMonthPart!.value).to.equal('03');

      // Update value externally
      store.value.updateFromString('12/25/2025');

      // Verify sections are updated
      const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(monthPart!.value).to.equal('12');

      const dayPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
      expect(dayPart!.value).to.equal('25');

      const yearPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
      expect(yearPart!.value).to.equal('2025');
    });

    it('should clear sections when value is reset to null', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
      });

      // Reset value to null
      store.value.clear();

      // All sections should be empty
      const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(monthPart!.value).to.equal('');

      const dayPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
      expect(dayPart!.value).to.equal('');

      const yearPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
      expect(yearPart!.value).to.equal('');
    });
  });
});
