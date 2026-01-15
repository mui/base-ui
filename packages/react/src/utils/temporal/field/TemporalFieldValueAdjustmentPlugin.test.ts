import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../time-field/root/TimeFieldStore';

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
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '15',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('16');
      });

      it('should set minimum value when section is empty', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section (empty)

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('01');
      });

      it('should wrap around to minimum when exceeding maximum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '31',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('01');
      });
    });

    describe('ArrowDown', () => {
      it('should decrement day by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '15',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('14');
      });

      it('should set maximum value when section is empty', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section (empty)

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('31');
      });

      it('should wrap around to maximum when going below minimum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '01',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('31');
      });
    });

    describe('PageUp', () => {
      it('should increment day by 5', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '10',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('PageUp');
        expect(newValue).to.equal('15');
      });

      it('should wrap around when exceeding maximum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '30',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('PageUp');
        expect(newValue).to.equal('04'); // 30 + 5 = 35, wraps to 04
      });
    });

    describe('PageDown', () => {
      it('should decrement day by 5', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '20',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('PageDown');
        expect(newValue).to.equal('15');
      });

      it('should wrap around when going below minimum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '03',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('PageDown');
        expect(newValue).to.equal('29'); // 03 - 5 = -2, wraps to 29
      });
    });

    describe('Home', () => {
      it('should set day to minimum value', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '20',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('Home');
        expect(newValue).to.equal('01');
      });
    });

    describe('End', () => {
      it('should set day to maximum value', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '05',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('End');
        expect(newValue).to.equal('31');
      });
    });

    describe('month section', () => {
      it('should increment month by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: '06',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('07');
      });

      it('should wrap around from December to January', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: '12',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('01');
      });

      it('should set minimum month value with Home', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: '08',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('Home');
        expect(newValue).to.equal('01');
      });

      it('should set maximum month value with End', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: '03',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('End');
        expect(newValue).to.equal('12');
      });
    });

    describe('year section', () => {
      it('should increment year by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(2); // year section
        store.section.updateValue({
          sectionIndex: 2,
          newSectionValue: '2024',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('2025');
      });

      it('should decrement year by 1', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(2); // year section
        store.section.updateValue({
          sectionIndex: 2,
          newSectionValue: '2024',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('2023');
      });

      it('should set current year when section is empty and pressing ArrowUp', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(2); // year section (empty)

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        const currentYear = new Date().getFullYear().toString();
        expect(newValue).to.equal(currentYear);
      });
    });

    describe('day section with ordinal suffix (digit-with-letter)', () => {
      it('should increment day with ordinal suffix', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '15th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('16th');
      });

      it('should decrement day with ordinal suffix', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '10th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('9th');
      });

      it('should handle special ordinal suffixes (1st, 2nd, 3rd)', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal

        // Test 1st
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '1st',
          shouldGoToNextSection: false,
        });
        let newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('2nd');

        // Test 2nd
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '2nd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('3rd');

        // Test 3rd
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '3rd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('4th');
      });

      it('should wrap around at month boundary', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '31st',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('1st');
      });

      it('should set minimum value with Home', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '20th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('Home');
        expect(newValue).to.equal('1st');
      });

      it('should set maximum value with End', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '5th',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('End');
        expect(newValue).to.equal('31st');
      });

      it('should handle 21st, 22nd, 23rd correctly', () => {
        const store = new DateFieldStore({ format: ordinalDayFormat }, adapter, 'ltr');
        store.section.setSelectedSection(1); // day section with ordinal

        // Test 21st
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '21st',
          shouldGoToNextSection: false,
        });
        let newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('22nd');

        // Test 22nd
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '22nd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('23rd');

        // Test 23rd
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '23rd',
          shouldGoToNextSection: false,
        });
        newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('24th');
      });
    });

    describe('minutes section with step', () => {
      it('should increment minutes by 5 (step)', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.setSelectedSection(1); // minutes section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '15',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('20');
      });

      it('should decrement minutes by 5 (step)', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.setSelectedSection(1); // minutes section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '30',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('25');
      });

      it('should snap to nearest step when not aligned', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.setSelectedSection(1); // minutes section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '17', // not aligned to 5-minute step
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('20'); // snaps up to 20
      });

      it('should wrap around at 60 minutes', () => {
        const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
        store.section.setSelectedSection(1); // minutes section
        store.section.updateValue({
          sectionIndex: 1,
          newSectionValue: '55',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('00');
      });
    });
  });

  describe('adjustActiveSectionValue - letter sections', () => {
    describe('month letter section', () => {
      it('should cycle through month names with ArrowUp', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: 'Jan',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('Feb');
      });

      it('should cycle through month names with ArrowDown', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: 'Feb',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('Jan');
      });

      it('should wrap around from December to January', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: 'Dec',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('Jan');
      });

      it('should wrap around from January to December', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: 'Jan',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('Dec');
      });

      it('should set first month with Home', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: 'Jun',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('Home');
        expect(newValue).to.equal('Jan');
      });

      it('should set last month with End', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section
        store.section.updateValue({
          sectionIndex: 0,
          newSectionValue: 'Jun',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('End');
        expect(newValue).to.equal('Dec');
      });

      it('should set first month when empty and pressing ArrowUp', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section (empty)

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('Jan');
      });

      it('should set last month when empty and pressing ArrowDown', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.setSelectedSection(0); // month section (empty)

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('Dec');
      });
    });

    describe('meridiem section', () => {
      it('should toggle between AM and PM with ArrowUp', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.setSelectedSection(2); // meridiem section
        store.section.updateValue({
          sectionIndex: 2,
          newSectionValue: 'AM',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('PM');
      });

      it('should toggle between PM and AM with ArrowDown', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.setSelectedSection(2); // meridiem section
        store.section.updateValue({
          sectionIndex: 2,
          newSectionValue: 'PM',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowDown');
        expect(newValue).to.equal('AM');
      });

      it('should wrap around from PM to AM', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.setSelectedSection(2); // meridiem section
        store.section.updateValue({
          sectionIndex: 2,
          newSectionValue: 'PM',
          shouldGoToNextSection: false,
        });

        const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
        expect(newValue).to.equal('AM');
      });
    });
  });

  describe('adjustActiveSectionValue - edge cases', () => {
    it('should return empty string when no active section', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      // Don't select any section

      const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
      expect(newValue).to.equal('');
    });

    it('should preserve padding for single-digit values', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      store.section.setSelectedSection(0); // month section
      store.section.updateValue({
        sectionIndex: 0,
        newSectionValue: '09',
        shouldGoToNextSection: false,
      });

      const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
      expect(newValue).to.equal('10');
    });

    it('should handle hours section correctly', () => {
      const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
      store.section.setSelectedSection(0); // hours section
      store.section.updateValue({
        sectionIndex: 0,
        newSectionValue: '14',
        shouldGoToNextSection: false,
      });

      const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
      expect(newValue).to.equal('15');
    });

    it('should wrap hours at 24', () => {
      const store = new TimeFieldStore({ format: time24Format }, adapter, 'ltr');
      store.section.setSelectedSection(0); // hours section
      store.section.updateValue({
        sectionIndex: 0,
        newSectionValue: '23',
        shouldGoToNextSection: false,
      });

      const newValue = store.valueAdjustment.adjustActiveSectionValue('ArrowUp');
      expect(newValue).to.equal('00');
    });
  });
});
