import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../time-field/root/TimeFieldStore';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

describe('TemporalFieldValueAdjustmentPlugin', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const monthNameDateFormat = `${adapter.formats.month3Letters} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;

  // Time formats
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  // Date format with ordinal day
  const ordinalDayFormat = `${adapter.formats.month3Letters} ${adapter.formats.dayOfMonthWithLetter}, ${adapter.formats.yearPadded}`;

  describe('isAdjustSectionValueKeyCode', () => {
    it('should return true for valid key codes', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');

      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('ArrowUp')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('ArrowDown')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('PageUp')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('PageDown')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('Home')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('End')).to.equal(true);
    });

    it('should return false for invalid key codes', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');

      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('Enter')).to.equal(false);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('Space')).to.equal(false);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('a')).to.equal(false);
    });
  });

  describe('adjustActiveSectionValue - digit sections', () => {
    describe('ArrowUp', () => {
      it('should increment day by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('16');
      });

      it('should set minimum value when section is empty', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section (empty)

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('01');
      });

      it('should wrap around to minimum when exceeding maximum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '31',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('01');
      });
    });

    describe('ArrowDown', () => {
      it('should decrement day by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('14');
      });

      it('should set maximum value when section is empty', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section (empty)

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('31');
      });

      it('should wrap around to maximum when going below minimum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '01',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('31');
      });
    });

    describe('PageUp', () => {
      it('should increment day by 5', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '10',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('PageUp');
        expect(newValue).to.equal('15');
      });

      it('should wrap around when exceeding maximum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '30',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('PageUp');
        expect(newValue).to.equal('04'); // 30 + 5 = 35, wraps to 04
      });
    });

    describe('PageDown', () => {
      it('should decrement day by 5', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '20',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('PageDown');
        expect(newValue).to.equal('15');
      });

      it('should wrap around when going below minimum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '03',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('PageDown');
        expect(newValue).to.equal('29'); // 03 - 5 = -2, wraps to 29
      });
    });

    describe('Home', () => {
      it('should set day to minimum value', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '20',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('Home');
        expect(newValue).to.equal('01');
      });
    });

    describe('End', () => {
      it('should set day to maximum value', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '05',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('End');
        expect(newValue).to.equal('31');
      });
    });

    describe('month section', () => {
      it('should increment month by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '06',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('07');
      });

      it('should wrap around from December to January', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '12',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('01');
      });

      it('should set minimum month value with Home', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '08',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('Home');
        expect(newValue).to.equal('01');
      });

      it('should set maximum month value with End', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '03',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('End');
        expect(newValue).to.equal('12');
      });

      it('should keep day value when incrementing month to a month with fewer days', () => {
        const store = new DateFieldStore(
          {
            format: numericDateFormat,
            defaultValue: adapter.date('2024-01-31', 'default'), // January 31st
          },
          adapter,
          'ltr',
        );

        // Verify initial state
        let value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getMonth(value!)).to.equal(0); // January (0-indexed)
        expect(adapter.getDate(value!)).to.equal(31); // 31st

        store.section.selectClosestDatePart(0); // month section

        const newMonthValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newMonthValue).to.equal('02'); // February

        // Apply the new month value - day value (31) is preserved in the field
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: newMonthValue,
          shouldGoToNextSection: false,
        });

        // The field should show "February 31" even though it's invalid
        const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        const dayPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(monthPart!.value).to.equal('02'); // February
        expect(dayPart!.value).to.equal('31'); // Day preserved

        // The actual date value becomes invalid (February 31 doesn't exist)
        value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.isValid(value)).to.equal(false); // Invalid date
      });

      it('should keep day value when decrementing month to a month with fewer days', () => {
        const store = new DateFieldStore(
          {
            format: numericDateFormat,
            defaultValue: adapter.date('2024-03-31', 'default'), // March 31st
          },
          adapter,
          'ltr',
        );

        // Verify initial state
        let value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getMonth(value!)).to.equal(2); // March (0-indexed)
        expect(adapter.getDate(value!)).to.equal(31); // 31st

        store.section.selectClosestDatePart(0); // month section

        const newMonthValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newMonthValue).to.equal('02'); // February

        // Apply the new month value - day value (31) is preserved in the field
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: newMonthValue,
          shouldGoToNextSection: false,
        });

        // The field should show "February 31" even though it's invalid
        const monthPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        const dayPart = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(monthPart!.value).to.equal('02'); // February
        expect(dayPart!.value).to.equal('31'); // Day preserved

        // The actual date value becomes invalid (February 31 doesn't exist)
        value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.isValid(value)).to.equal(false); // Invalid date
      });
    });

    describe('year section', () => {
      it('should increment year by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // year section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: '2024',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('2025');
      });

      it('should decrement year by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // year section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: '2024',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('2023');
      });

      it('should set current year when section is empty and pressing ArrowUp', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // year section (empty)

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        const currentYear = new Date().getFullYear().toString();
        expect(newValue).to.equal(currentYear);
      });
    });

    describe('day section with ordinal suffix (digit-with-letter)', () => {
      it('should increment day with ordinal suffix', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('16th');
      });

      it('should decrement day with ordinal suffix', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '10th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('9th');
      });

      it('should handle special ordinal suffixes (1st, 2nd, 3rd)', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal

        // Test 1st
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '1st',
          shouldGoToNextSection: false,
        });
        let newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('2nd');

        // Test 2nd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '2nd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('3rd');

        // Test 3rd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '3rd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('4th');
      });

      it('should wrap around at month boundary', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '31st',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('1st');
      });

      it('should set minimum value with Home', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '20th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('Home');
        expect(newValue).to.equal('1st');
      });

      it('should set maximum value with End', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '5th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('End');
        expect(newValue).to.equal('31st');
      });

      it('should handle 21st, 22nd, 23rd correctly', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section with ordinal

        // Test 21st
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '21st',
          shouldGoToNextSection: false,
        });
        let newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('22nd');

        // Test 22nd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '22nd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('23rd');

        // Test 23rd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '23rd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('24th');
      });
    });

    describe('minutes section with step', () => {
      it('should increment minutes by 5 (step)', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('20');
      });

      it('should decrement minutes by 5 (step)', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '30',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('25');
      });

      it('should snap to nearest step when not aligned', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '17', // not aligned to 5-minute step
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('20'); // snaps up to 20
      });

      it('should wrap around at 60 minutes', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '55',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('00');
      });
    });
  });

  describe('adjustActiveSectionValue - letter sections', () => {
    describe('month letter section', () => {
      it('should cycle through month names with ArrowUp', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jan',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('Feb');
      });

      it('should cycle through month names with ArrowDown', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Feb',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('Jan');
      });

      it('should wrap around from December to January', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Dec',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('Jan');
      });

      it('should wrap around from January to December', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jan',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('Dec');
      });

      it('should set first month with Home', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jun',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('Home');
        expect(newValue).to.equal('Jan');
      });

      it('should set last month with End', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jun',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('End');
        expect(newValue).to.equal('Dec');
      });

      it('should set first month when empty and pressing ArrowUp', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section (empty)

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('Jan');
      });

      it('should set last month when empty and pressing ArrowDown', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section (empty)

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('Dec');
      });
    });

    describe('meridiem section', () => {
      it('should toggle between AM and PM with ArrowUp', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // meridiem section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: 'AM',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('PM');
      });

      it('should toggle between PM and AM with ArrowDown', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // meridiem section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: 'PM',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('AM');
      });

      it('should wrap around from PM to AM', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // meridiem section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: 'PM',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('AM');
      });
    });

    describe('12-hour format hours', () => {
      it('should wrap hours from 12 to 1 when incrementing', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '12',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('01');
      });

      it('should wrap hours from 1 to 12 when decrementing', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '01',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowDown');
        expect(newValue).to.equal('12');
      });

      it('should increment hours correctly in 12-hour format', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '05',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
        expect(newValue).to.equal('06');
      });
    });
  });

  describe('adjustActiveSectionValue - edge cases', () => {
    it('should return empty string when no active section', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      // Don't select any section

      const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
      expect(newValue).to.equal('');
    });

    it('should preserve padding for single-digit values', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '09',
        shouldGoToNextSection: false,
      });

      const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
      expect(newValue).to.equal('10');
    });

    it('should handle hours section correctly', () => {
      const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // hours section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '14',
        shouldGoToNextSection: false,
      });

      const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
      expect(newValue).to.equal('15');
    });

    it('should wrap hours at 24', () => {
      const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // hours section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '23',
        shouldGoToNextSection: false,
      });

      const newValue = store.valueAdjustment.adjustActiveDatePartValue('ArrowUp');
      expect(newValue).to.equal('00');
    });
  });
});
