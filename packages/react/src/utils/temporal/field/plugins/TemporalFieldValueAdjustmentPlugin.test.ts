import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../../time-field/root/TimeFieldStore';
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

  function getDatePartValue(store: DateFieldStore | TimeFieldStore, sectionIndex: number) {
    return TemporalFieldSectionPlugin.selectors.datePart(store.state, sectionIndex)?.value ?? '';
  }

  describe('isAdjustSectionValueKeyCode', () => {
    it('should return true for valid key codes', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('ArrowUp')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('ArrowDown')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('PageUp')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('PageDown')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('Home')).to.equal(true);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('End')).to.equal(true);
    });

    it('should return false for invalid key codes', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });

      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('Enter')).to.equal(false);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('Space')).to.equal(false);
      expect(store.valueAdjustment.isAdjustSectionValueKeyCode('a')).to.equal(false);
    });
  });

  describe('adjustActiveSectionValue - digit sections', () => {
    describe('ArrowUp', () => {
      it('should increment day by 1', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('16');
      });

      it('should set minimum value when section is empty', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section (empty)

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('01');
      });

      it('should wrap around to minimum when exceeding maximum', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '31',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('01');
      });
    });

    describe('ArrowDown', () => {
      it('should decrement day by 1', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('14');
      });

      it('should set maximum value when section is empty', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section (empty)

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('31');
      });

      it('should wrap around to maximum when going below minimum', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '01',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('31');
      });
    });

    describe('PageUp', () => {
      it('should increment day by 5', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '10',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('PageUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('15');
      });

      it('should wrap around when exceeding maximum', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '30',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('PageUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('04'); // 30 + 5 = 35, wraps to 04
      });
    });

    describe('PageDown', () => {
      it('should decrement day by 5', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '20',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('PageDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('15');
      });

      it('should wrap around when going below minimum', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '03',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('PageDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('29'); // 03 - 5 = -2, wraps to 29
      });
    });

    describe('Home', () => {
      it('should set day to minimum value', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '20',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
        expect(getDatePartValue(store, 2)).to.equal('01');
      });
    });

    describe('End', () => {
      it('should set day to maximum value', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '05',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('End', 2);
        expect(getDatePartValue(store, 2)).to.equal('31');
      });
    });

    describe('month section', () => {
      it('should increment month by 1', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '06',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('07');
      });

      it('should wrap around from December to January', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '12',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('01');
      });

      it('should set minimum month value with Home', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '08',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('Home', 0);
        expect(getDatePartValue(store, 0)).to.equal('01');
      });

      it('should set maximum month value with End', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '03',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('End', 0);
        expect(getDatePartValue(store, 0)).to.equal('12');
      });

      it('should keep day value when incrementing month to a month with fewer days', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-01-31', 'default'), // January 31st
          adapter,
          direction: 'ltr',
        });

        // Verify initial state
        let value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getMonth(value!)).to.equal(0); // January (0-indexed)
        expect(adapter.getDate(value!)).to.equal(31); // 31st

        store.section.selectClosestDatePart(0); // month section

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('02'); // February

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
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-31', 'default'), // March 31st
          adapter,
          direction: 'ltr',
        });

        // Verify initial state
        let value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getMonth(value!)).to.equal(2); // March (0-indexed)
        expect(adapter.getDate(value!)).to.equal(31); // 31st

        store.section.selectClosestDatePart(0); // month section

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 0);
        expect(getDatePartValue(store, 0)).to.equal('02'); // February

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
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(4); // year section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: '2024',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
        expect(getDatePartValue(store, 4)).to.equal('2025');
      });

      it('should decrement year by 1', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(4); // year section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: '2024',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 4);
        expect(getDatePartValue(store, 4)).to.equal('2023');
      });

      describe('initialization (empty year section)', () => {
        it('should set current year when pressing ArrowUp and no minDate', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
          const currentYear = new Date().getFullYear().toString();
          expect(getDatePartValue(store, 4)).to.equal(currentYear);
        });

        it('should set current year when pressing PageUp and no minDate', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('PageUp', 4);
          const currentYear = new Date().getFullYear().toString();
          expect(getDatePartValue(store, 4)).to.equal(currentYear);
        });

        it('should set current year when pressing ArrowDown and no maxDate', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 4);
          const currentYear = new Date().getFullYear().toString();
          expect(getDatePartValue(store, 4)).to.equal(currentYear);
        });

        it('should set current year when pressing PageDown and no maxDate', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('PageDown', 4);
          const currentYear = new Date().getFullYear().toString();
          expect(getDatePartValue(store, 4)).to.equal(currentYear);
        });

        it('should set minDate year when pressing ArrowUp and minDate is set', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2020-01-01', 'default'),
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
          expect(getDatePartValue(store, 4)).to.equal('2020');
        });

        it('should set minDate year when pressing PageUp and minDate is set', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2020-01-01', 'default'),
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('PageUp', 4);
          expect(getDatePartValue(store, 4)).to.equal('2020');
        });

        it('should set maxDate year when pressing ArrowDown and maxDate is set', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            maxDate: adapter.date('2030-12-31', 'default'),
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 4);
          expect(getDatePartValue(store, 4)).to.equal('2030');
        });

        it('should set maxDate year when pressing PageDown and maxDate is set', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            maxDate: adapter.date('2030-12-31', 'default'),
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('PageDown', 4);
          expect(getDatePartValue(store, 4)).to.equal('2030');
        });

        it('should set current year when pressing ArrowDown with minDate but no maxDate', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2020-01-01', 'default'),
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 4);
          const currentYear = new Date().getFullYear().toString();
          expect(getDatePartValue(store, 4)).to.equal(currentYear);
        });

        it('should set current year when pressing ArrowUp with maxDate but no minDate', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            maxDate: adapter.date('2030-12-31', 'default'),
          });
          store.section.selectClosestDatePart(4); // year section (empty)

          store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
          const currentYear = new Date().getFullYear().toString();
          expect(getDatePartValue(store, 4)).to.equal(currentYear);
        });
      });
    });

    describe('day section with ordinal suffix (digit-with-letter)', () => {
      it('should increment day with ordinal suffix', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15th',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('16th');
      });

      it('should decrement day with ordinal suffix', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '10th',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('9th');
      });

      it('should handle special ordinal suffixes (1st, 2nd, 3rd)', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal

        // Test 1st
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '1st',
          shouldGoToNextSection: false,
        });
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('2nd');

        // Test 2nd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '2nd',
          shouldGoToNextSection: false,
        });
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('3rd');

        // Test 3rd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '3rd',
          shouldGoToNextSection: false,
        });
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('4th');
      });

      it('should wrap around at month boundary', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '31st',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('1st');
      });

      it('should set minimum value with Home', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '20th',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
        expect(getDatePartValue(store, 2)).to.equal('1st');
      });

      it('should set maximum value with End', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '5th',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('End', 2);
        expect(getDatePartValue(store, 2)).to.equal('31st');
      });

      it('should handle 21st, 22nd, 23rd correctly', () => {
        const store = new DateFieldStore({
          format: ordinalDayFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // day section with ordinal

        // Test 21st
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '21st',
          shouldGoToNextSection: false,
        });
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('22nd');

        // Test 22nd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '22nd',
          shouldGoToNextSection: false,
        });
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('23rd');

        // Test 23rd
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '23rd',
          shouldGoToNextSection: false,
        });
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('24th');
      });
    });

    describe('minutes section with step', () => {
      it('should increment minutes by 5 (step)', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
          step: 5,
        });
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('20');
      });

      it('should decrement minutes by 5 (step)', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
          step: 5,
        });
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '30',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 2);
        expect(getDatePartValue(store, 2)).to.equal('25');
      });

      it('should snap to nearest step when not aligned', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
          step: 5,
        });
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '17', // not aligned to 5-minute step
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('20'); // snaps up to 20
      });

      it('should wrap around at 60 minutes', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
          step: 5,
        });
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '55',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('00');
      });

      it('should not apply step to non-most-granular sections', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
          step: 5,
        });
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '10',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('11'); // hours increment by 1, not 5
      });

      it('should default step to 1 when not specified', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(2); // minutes section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '15',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('16'); // increments by 1 (default step)
      });
    });
  });

  describe('adjustActiveSectionValue - letter sections', () => {
    describe('month letter section', () => {
      it('should cycle through month names with ArrowUp', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jan',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('Feb');
      });

      it('should cycle through month names with ArrowDown', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Feb',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 0);
        expect(getDatePartValue(store, 0)).to.equal('Jan');
      });

      it('should wrap around from December to January', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Dec',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('Jan');
      });

      it('should wrap around from January to December', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jan',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 0);
        expect(getDatePartValue(store, 0)).to.equal('Dec');
      });

      it('should set first month with Home', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jun',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('Home', 0);
        expect(getDatePartValue(store, 0)).to.equal('Jan');
      });

      it('should set last month with End', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jun',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('End', 0);
        expect(getDatePartValue(store, 0)).to.equal('Dec');
      });

      it('should set first month when empty and pressing ArrowUp', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section (empty)

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('Jan');
      });

      it('should set last month when empty and pressing ArrowDown', () => {
        const store = new DateFieldStore({
          format: monthNameDateFormat,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // month section (empty)

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 0);
        expect(getDatePartValue(store, 0)).to.equal('Dec');
      });
    });

    describe('meridiem section', () => {
      it('should toggle between AM and PM with ArrowUp', () => {
        const store = new TimeFieldStore({
          format: time12Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(4); // meridiem section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: 'AM',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
        expect(getDatePartValue(store, 4)).to.equal('PM');
      });

      it('should toggle between PM and AM with ArrowDown', () => {
        const store = new TimeFieldStore({
          format: time12Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(4); // meridiem section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: 'PM',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 4);
        expect(getDatePartValue(store, 4)).to.equal('AM');
      });

      it('should wrap around from PM to AM', () => {
        const store = new TimeFieldStore({
          format: time12Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(4); // meridiem section
        store.section.updateDatePart({
          sectionIndex: 4,
          newDatePartValue: 'PM',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
        expect(getDatePartValue(store, 4)).to.equal('AM');
      });
    });

    describe('12-hour format hours', () => {
      it('should wrap hours from 12 to 1 when incrementing', () => {
        const store = new TimeFieldStore({
          format: time12Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '12',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('01');
      });

      it('should wrap hours from 1 to 12 when decrementing', () => {
        const store = new TimeFieldStore({
          format: time12Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '01',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 0);
        expect(getDatePartValue(store, 0)).to.equal('12');
      });

      it('should increment hours correctly in 12-hour format', () => {
        const store = new TimeFieldStore({
          format: time12Format,
          adapter,
          direction: 'ltr',
        });
        store.section.selectClosestDatePart(0); // hours section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: '05',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('06');
      });
    });

    describe('letter section with step', () => {
      // Format with month (letter, granularity 2) as most granular, year (digit, granularity 1) as less granular
      const monthYearFormat = `${adapter.formats.month3Letters} ${adapter.formats.yearPadded}`;

      it('should skip months by step when month is the most granular section', () => {
        const store = new DateFieldStore({
          format: monthYearFormat,
          adapter,
          direction: 'ltr',
          step: 2,
        });
        store.section.selectClosestDatePart(0); // month section
        store.section.updateDatePart({
          sectionIndex: 0,
          newDatePartValue: 'Jan',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
        expect(getDatePartValue(store, 0)).to.equal('Mar'); // skips by 2
      });

      it('should not apply step to year when month is the most granular', () => {
        const store = new DateFieldStore({
          format: monthYearFormat,
          adapter,
          direction: 'ltr',
          step: 2,
        });
        store.section.selectClosestDatePart(2); // year section
        store.section.updateDatePart({
          sectionIndex: 2,
          newDatePartValue: '2024',
          shouldGoToNextSection: false,
        });

        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
        expect(getDatePartValue(store, 2)).to.equal('2025'); // year increments by 1, not 2
      });
    });
  });

  describe('adjustActiveSectionValue - edge cases', () => {
    it('should not update store when not editable', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
        readOnly: true,
      });
      store.section.selectClosestDatePart(2); // day section
      store.section.updateDatePart({
        sectionIndex: 2,
        newDatePartValue: '15',
        shouldGoToNextSection: false,
      });

      store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);
      expect(getDatePartValue(store, 2)).to.equal('15');
    });

    it('should preserve padding for single-digit values', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
      });
      store.section.selectClosestDatePart(0); // month section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '09',
        shouldGoToNextSection: false,
      });

      store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
      expect(getDatePartValue(store, 0)).to.equal('10');
    });

    it('should handle hours section correctly', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        adapter,
        direction: 'ltr',
      });
      store.section.selectClosestDatePart(0); // hours section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '14',
        shouldGoToNextSection: false,
      });

      store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
      expect(getDatePartValue(store, 0)).to.equal('15');
    });

    it('should wrap hours at 24', () => {
      const store = new TimeFieldStore({
        format: time24Format,
        adapter,
        direction: 'ltr',
      });
      store.section.selectClosestDatePart(0); // hours section
      store.section.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '23',
        shouldGoToNextSection: false,
      });

      store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
      expect(getDatePartValue(store, 0)).to.equal('00');
    });
  });

  describe('adjustment boundaries with validation props', () => {
    describe('DateField - minDate and maxDate', () => {
      describe('same year', () => {
        // minDate=2024-04-02, maxDate=2024-07-03
        // year: [2024, 2024], month: [4, 7], day: unchanged

        it('should restrict year section to the single valid year', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2024-07-03', 'default'),
          });

          store.section.selectClosestDatePart(4); // year section
          store.section.updateDatePart({
            sectionIndex: 4,
            newDatePartValue: '2024',
            shouldGoToNextSection: false,
          });

          // ArrowUp from 2024 should wrap to 2024 (same min and max)
          store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
          expect(getDatePartValue(store, 4)).to.equal('2024');
        });

        it('should restrict month range when years are the same', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2024-07-03', 'default'),
          });

          store.section.selectClosestDatePart(0); // month section

          // Home should go to min month (04)
          store.section.updateDatePart({
            sectionIndex: 0,
            newDatePartValue: '06',
            shouldGoToNextSection: false,
          });
          store.valueAdjustment.adjustActiveDatePartValue('Home', 0);
          expect(getDatePartValue(store, 0)).to.equal('04');

          // End should go to max month (07)
          store.valueAdjustment.adjustActiveDatePartValue('End', 0);
          expect(getDatePartValue(store, 0)).to.equal('07');
        });

        it('should wrap month within restricted range', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2024-07-03', 'default'),
          });

          store.section.selectClosestDatePart(0); // month section
          store.section.updateDatePart({
            sectionIndex: 0,
            newDatePartValue: '07',
            shouldGoToNextSection: false,
          });

          // ArrowUp from 07 (max) should wrap to 04 (min)
          store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);
          expect(getDatePartValue(store, 0)).to.equal('04');
        });

        it('should not restrict day section when years are same but months differ', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2024-07-03', 'default'),
          });

          store.section.selectClosestDatePart(2); // day section
          store.section.updateDatePart({
            sectionIndex: 2,
            newDatePartValue: '15',
            shouldGoToNextSection: false,
          });

          // Home should go to structural min (01), not minDate day (02)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
          expect(getDatePartValue(store, 2)).to.equal('01');

          // End should go to structural max (31), not maxDate day (03)
          store.valueAdjustment.adjustActiveDatePartValue('End', 2);
          expect(getDatePartValue(store, 2)).to.equal('31');
        });
      });

      describe('different years', () => {
        // minDate=2024-04-02, maxDate=2025-01-01
        // year: [2024, 2025], month: unchanged, day: unchanged

        it('should restrict year range', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2025-01-01', 'default'),
          });

          store.section.selectClosestDatePart(4); // year section
          store.section.updateDatePart({
            sectionIndex: 4,
            newDatePartValue: '2024',
            shouldGoToNextSection: false,
          });

          // Home should go to min year (2024)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 4);
          expect(getDatePartValue(store, 4)).to.equal('2024');

          // End should go to max year (2025)
          store.valueAdjustment.adjustActiveDatePartValue('End', 4);
          expect(getDatePartValue(store, 4)).to.equal('2025');
        });

        it('should not restrict month when years differ', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2025-01-01', 'default'),
          });

          store.section.selectClosestDatePart(0); // month section
          store.section.updateDatePart({
            sectionIndex: 0,
            newDatePartValue: '06',
            shouldGoToNextSection: false,
          });

          // Home should go to structural min (01), not minDate month (04)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 0);
          expect(getDatePartValue(store, 0)).to.equal('01');

          // End should go to structural max (12), not maxDate month (01)
          store.valueAdjustment.adjustActiveDatePartValue('End', 0);
          expect(getDatePartValue(store, 0)).to.equal('12');
        });

        it('should not restrict day when years differ', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
            maxDate: adapter.date('2025-01-01', 'default'),
          });

          store.section.selectClosestDatePart(2); // day section
          store.section.updateDatePart({
            sectionIndex: 2,
            newDatePartValue: '15',
            shouldGoToNextSection: false,
          });

          store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
          expect(getDatePartValue(store, 2)).to.equal('01');

          store.valueAdjustment.adjustActiveDatePartValue('End', 2);
          expect(getDatePartValue(store, 2)).to.equal('31');
        });
      });

      describe('same year and month', () => {
        // minDate=2024-04-05, maxDate=2024-04-20
        // year: [2024, 2024], month: [4, 4], day: [5, 20]

        it('should restrict day range when year and month are the same', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-05', 'default'),
            maxDate: adapter.date('2024-04-20', 'default'),
          });

          store.section.selectClosestDatePart(2); // day section
          store.section.updateDatePart({
            sectionIndex: 2,
            newDatePartValue: '10',
            shouldGoToNextSection: false,
          });

          // Home should go to restricted min (05)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
          expect(getDatePartValue(store, 2)).to.equal('05');

          // End should go to restricted max (20)
          store.valueAdjustment.adjustActiveDatePartValue('End', 2);
          expect(getDatePartValue(store, 2)).to.equal('20');
        });
      });

      describe('only minDate provided', () => {
        it('should restrict min side only, max stays structural', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-04-02', 'default'),
          });

          store.section.selectClosestDatePart(4); // year section
          store.section.updateDatePart({
            sectionIndex: 4,
            newDatePartValue: '2024',
            shouldGoToNextSection: false,
          });

          // Home should go to restricted min year (2024)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 4);
          expect(getDatePartValue(store, 4)).to.equal('2024');

          // End should go to structural max year (9999)
          store.valueAdjustment.adjustActiveDatePartValue('End', 4);
          expect(getDatePartValue(store, 4)).to.equal('9999');
        });
      });

      describe('only maxDate provided', () => {
        it('should restrict max side only, min stays structural', () => {
          const store = new DateFieldStore({
            format: numericDateFormat,
            adapter,
            direction: 'ltr',
            maxDate: adapter.date('2025-07-15', 'default')
          });

          store.section.selectClosestDatePart(4); // year section
          store.section.updateDatePart({
            sectionIndex: 4,
            newDatePartValue: '2025',
            shouldGoToNextSection: false,
          });

          // Home should go to structural min year (0)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 4);
          expect(getDatePartValue(store, 4)).to.equal('0000');

          // End should go to restricted max year (2025)
          store.valueAdjustment.adjustActiveDatePartValue('End', 4);
          expect(getDatePartValue(store, 4)).to.equal('2025');
        });
      });
    });

    describe('TimeField - minDate and maxDate', () => {
      describe('different hours', () => {
        it('should restrict hours range', () => {
          const store = new TimeFieldStore({
            format: time24Format,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-01-01T10:30', 'default'),
            maxDate: adapter.date('2024-01-01T14:45', 'default'),
          });

          store.section.selectClosestDatePart(0); // hours section
          store.section.updateDatePart({
            sectionIndex: 0,
            newDatePartValue: '12',
            shouldGoToNextSection: false,
          });

          // Home should go to min hour (10)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 0);
          expect(getDatePartValue(store, 0)).to.equal('10');

          // End should go to max hour (14)
          store.valueAdjustment.adjustActiveDatePartValue('End', 0);
          expect(getDatePartValue(store, 0)).to.equal('14');
        });

        it('should not restrict minutes when hours differ', () => {
          const store = new TimeFieldStore({
            format: time24Format,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-01-01T10:30', 'default'),
            maxDate: adapter.date('2024-01-01T14:45', 'default'),
          });

          store.section.selectClosestDatePart(2); // minutes section
          store.section.updateDatePart({
            sectionIndex: 2,
            newDatePartValue: '15',
            shouldGoToNextSection: false,
          });

          // Home should go to structural min (00)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
          expect(getDatePartValue(store, 2)).to.equal('00');

          // End should go to structural max (59)
          store.valueAdjustment.adjustActiveDatePartValue('End', 2);
          expect(getDatePartValue(store, 2)).to.equal('59');
        });
      });

      describe('same hour', () => {
        it('should restrict minutes when hours are the same', () => {
          const store = new TimeFieldStore({
            format: time24Format,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-01-01T10:15', 'default'),
            maxDate: adapter.date('2024-01-01T10:45', 'default'),
          });

          store.section.selectClosestDatePart(2); // minutes section
          store.section.updateDatePart({
            sectionIndex: 2,
            newDatePartValue: '30',
            shouldGoToNextSection: false,
          });

          // Home should go to restricted min minutes (15)
          store.valueAdjustment.adjustActiveDatePartValue('Home', 2);
          expect(getDatePartValue(store, 2)).to.equal('15');

          // End should go to restricted max minutes (45)
          store.valueAdjustment.adjustActiveDatePartValue('End', 2);
          expect(getDatePartValue(store, 2)).to.equal('45');
        });
      });

      describe('meridiem restriction', () => {
        // it('should restrict meridiem to PM when both minDate and maxDate are PM', () => {
        //   const store = new TimeFieldStore({
        //     format: time12Format,
        //     adapter,
        //     direction: 'ltr',
        //     validationProps: {
        //       minDate: adapter.date('2024-01-01T13:00', 'default'), // 1 PM
        //       maxDate: adapter.date('2024-01-01T16:00', 'default'), // 4 PM
        //     },
        //   });

        //   store.section.selectClosestDatePart(4); // meridiem section
        //   store.section.updateDatePart({
        //     sectionIndex: 4,
        //     newDatePartValue: 'PM',
        //     shouldGoToNextSection: false,
        //   });

        //   // ArrowUp from PM should stay PM (restricted to PM only)
        //   store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
        //   expect(getDatePartValue(store, 4)).to.equal('PM');

        //   // ArrowDown from PM should also stay PM
        //   store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 4);
        //   expect(getDatePartValue(store, 4)).to.equal('PM');
        // });

        it('should not restrict meridiem when minDate is AM and maxDate is PM', () => {
          const store = new TimeFieldStore({
            format: time12Format,
            adapter,
            direction: 'ltr',
            minDate: adapter.date('2024-01-01T08:00', 'default'), // 8 AM
            maxDate: adapter.date('2024-01-01T16:00', 'default'), // 4 PM,
          });

          store.section.selectClosestDatePart(4); // meridiem section
          store.section.updateDatePart({
            sectionIndex: 4,
            newDatePartValue: 'AM',
            shouldGoToNextSection: false,
          });

          // Should be able to toggle between AM and PM
          store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);
          expect(getDatePartValue(store, 4)).to.equal('PM');
        });
      });
    });
  });

  describe('weekDay section (format with both weekDay and day)', () => {
    // Format: "EEEE, MMMM dd, yyyy" (e.g., "Friday, January 30, 2026")
    // Section indices: 0=weekDay, 1=sep, 2=month, 3=sep, 4=day, 5=sep, 6=year
    const weekDayDateFormat = `${adapter.formats.weekday}, ${adapter.formats.monthFullLetter} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;

    describe('ArrowDown', () => {
      it('should decrement weekDay when format has both weekDay and day', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday
          adapter,
          direction: 'ltr',
        });

        // weekDay section is index 0
        store.section.selectClosestDatePart(0);
        store.valueAdjustment.adjustActiveDatePartValue('ArrowDown', 0);

        // Should now show Thursday
        expect(getDatePartValue(store, 0)).to.equal('Thursday');

        // The actual date should be January 29, 2026 (Thursday)
        const value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getDate(value!)).to.equal(29);
      });
    });

    describe('ArrowUp', () => {
      it('should increment weekDay when format has both weekDay and day', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday
          adapter,
          direction: 'ltr',
        });

        store.section.selectClosestDatePart(0);
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 0);

        // Should now show Saturday
        expect(getDatePartValue(store, 0)).to.equal('Saturday');

        // The actual date should be January 31, 2026 (Saturday)
        const value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getDate(value!)).to.equal(31);
      });
    });

    describe('PageDown', () => {
      it('should decrement weekDay by 5 when format has both weekDay and day', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday (day 5)
          adapter,
          direction: 'ltr',
        });

        store.section.selectClosestDatePart(0);
        store.valueAdjustment.adjustActiveDatePartValue('PageDown', 0);

        // Friday - 5 = Sunday (wraps around)
        expect(getDatePartValue(store, 0)).to.equal('Sunday');

        // The actual date should be January 25, 2026 (Sunday)
        const value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getDate(value!)).to.equal(25);
      });
    });

    describe('PageUp', () => {
      it('should increment weekDay by 5 when format has both weekDay and day', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday (day 5)
          adapter,
          direction: 'ltr',
        });

        store.section.selectClosestDatePart(0);
        store.valueAdjustment.adjustActiveDatePartValue('PageUp', 0);

        // Friday + 5 in options = Wednesday (wraps around in the cycle)
        expect(getDatePartValue(store, 0)).to.equal('Wednesday');

        // The actual date should be January 28, 2026 (Wednesday)
        // Wednesday is 2 days before Friday, so Jan 30 - 2 = Jan 28
        const value = TemporalFieldValuePlugin.selectors.value(store.state);
        expect(adapter.getDate(value!)).to.equal(28);
        expect(adapter.getMonth(value!)).to.equal(0); // January (0-indexed)
      });
    });

    describe('other date parts should still work', () => {
      it('should increment month correctly with weekDay in format', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday, January 30, 2026
          adapter,
          direction: 'ltr',
        });

        // month section is index 2
        store.section.selectClosestDatePart(2);
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 2);

        // Should now show February
        expect(getDatePartValue(store, 2)).to.equal('February');
      });

      it('should increment day correctly with weekDay in format', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday, January 30, 2026
          adapter,
          direction: 'ltr',
        });

        // day section is index 4
        store.section.selectClosestDatePart(4);
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 4);

        // Day should be 31
        expect(getDatePartValue(store, 4)).to.equal('31');

        // WeekDay should update to Saturday
        expect(getDatePartValue(store, 0)).to.equal('Saturday');
      });

      it('should increment year correctly with weekDay in format', () => {
        const store = new DateFieldStore({
          format: weekDayDateFormat,
          defaultValue: adapter.date('2026-01-30', 'default'), // Friday, January 30, 2026
          adapter,
          direction: 'ltr',
        });

        // year section is index 6
        store.section.selectClosestDatePart(6);
        store.valueAdjustment.adjustActiveDatePartValue('ArrowUp', 6);

        // Year should be 2027
        expect(getDatePartValue(store, 6)).to.equal('2027');

        // WeekDay should update to Saturday (Jan 30, 2027 is Saturday)
        expect(getDatePartValue(store, 0)).to.equal('Saturday');
      });
    });
  });
});
