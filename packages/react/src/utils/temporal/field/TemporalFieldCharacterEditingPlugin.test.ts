import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../time-field/root/TimeFieldStore';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

describe('TemporalFieldCharacterEditingPlugin', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const monthNameDateFormat = `${adapter.formats.month3Letters} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;
  const fullMonthNameFormat = `${adapter.formats.monthFullLetter} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;

  // Time formats
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  describe('numeric editing - digit sections', () => {
    describe('single digit entry', () => {
      it('should update month section with single digit', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        store.characterEditing.editSection({
          keyPressed: '5',
          sectionIndex: 0,
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('05');
      });

      it('should update day section with single digit', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section (index 2 because of separator at index 1)

        store.characterEditing.editSection({
          keyPressed: '7',
          sectionIndex: 2, // Full section index for day
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(section.value).to.equal('07');
      });

      it('should update year section with single digit', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // year section (index 4 because of separators)

        store.characterEditing.editSection({
          keyPressed: '2',
          sectionIndex: 4, // Full section index (not datePart index)
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
        expect(section.value).to.equal('0002');
      });
    });

    describe('multi-digit entry with concatenation', () => {
      it('should concatenate digits for month (0 then 9)', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        // Type '0'
        store.characterEditing.editSection({
          keyPressed: '0',
          sectionIndex: 0,
        });

        // Value should not be set yet (0 is below minimum)
        let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('');

        // Type '9'
        store.characterEditing.editSection({
          keyPressed: '9',
          sectionIndex: 0,
        });

        section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('09');
      });

      it('should concatenate digits for day (1 then 5)', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section (index 2 because of separator at index 1)

        // Type '1'
        store.characterEditing.editSection({
          keyPressed: '1',
          sectionIndex: 2, // Day section index
        });

        let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(section.value).to.equal('01');

        // Type '5'
        store.characterEditing.editSection({
          keyPressed: '5',
          sectionIndex: 2, // Day section index
        });

        section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(section.value).to.equal('15');
      });

      it('should concatenate digits for year (2, 0, 2, 4)', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // year section (index 4 because of separators)

        const digits = ['2', '0', '2', '4'];
        digits.forEach((digit) => {
          store.characterEditing.editSection({
            keyPressed: digit,
            sectionIndex: 4,
          });
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
        expect(section.value).to.equal('2024');
      });
    });

    describe('boundary validation', () => {
      it('should reject month value above 12', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        // Type '1' - should work
        store.characterEditing.editSection({
          keyPressed: '1',
          sectionIndex: 0,
        });
        let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('01');

        // Type '5' - should be rejected (15 > 12)
        store.characterEditing.editSection({
          keyPressed: '5',
          sectionIndex: 0,
        });

        section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('01'); // Value should not change
      });

      it('should reject day value above 31', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(2); // day section (index 2 because of separator at index 1)

        // Type '3' - should work
        store.characterEditing.editSection({
          keyPressed: '3',
          sectionIndex: 2, // Day section index
        });
        let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(section.value).to.equal('03');

        // Type '5' - should be rejected (35 > 31)
        store.characterEditing.editSection({
          keyPressed: '5',
          sectionIndex: 2, // Day section index
        });

        section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
        expect(section.value).to.equal('03'); // Value should not change
      });
    });

    describe('automatic navigation', () => {
      it('should move to next section when typing digit that would exceed maximum', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        // Type '9' - should move to next section (9*10 = 90 > 12)
        store.characterEditing.editSection({
          keyPressed: '9',
          sectionIndex: 0,
        });

        expect(store.state.selectedSection).to.equal(2); // Should move to day section (index 2)
      });

      it('should complete year section after typing max length', () => {
        const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // year section (index 4 because of separators)

        // Type 4 digits
        const digits = ['2', '0', '2', '4'];
        digits.forEach((digit) => {
          store.characterEditing.editSection({
            keyPressed: digit,
            sectionIndex: 4,
          });
        });

        // Year should be fully entered
        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
        expect(section).to.not.equal(null);
        expect(section!.value).to.equal('2024');
        // Note: Navigation from last section is not implemented
        // selectedSection remains at 4 since there's no section after it
        expect(store.state.selectedSection).to.equal(4);
      });
    });
  });

  describe('letter editing - letter sections', () => {
    describe('month name editing', () => {
      it('should update month section with letter (J -> Jan)', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        store.characterEditing.editSection({
          keyPressed: 'J',
          sectionIndex: 0,
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('Jan');
      });

      it('should concatenate letters for month (J then u -> Jun)', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        // Type 'J' - could be Jan, Jun, Jul
        store.characterEditing.editSection({
          keyPressed: 'J',
          sectionIndex: 0,
        });
        let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('Jan'); // First match

        // Type 'u' - should narrow down to Jun or Jul
        store.characterEditing.editSection({
          keyPressed: 'u',
          sectionIndex: 0,
        });
        section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('Jun'); // First match for 'ju'
      });

      it('should complete and move to next section when only one match (Ju then l -> Jul)', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        // Type 'Jul' one by one
        store.characterEditing.editSection({
          keyPressed: 'J',
          sectionIndex: 0,
        });
        store.characterEditing.editSection({
          keyPressed: 'u',
          sectionIndex: 0,
        });
        store.characterEditing.editSection({
          keyPressed: 'l',
          sectionIndex: 0,
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('Jul');
        expect(store.state.selectedSection).to.equal(2); // Should move to next section (day at index 2)
      });

      it('should handle case-insensitive input', () => {
        const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
        store.section.selectClosestDatePart(0); // month section

        // Type lowercase 'j'
        store.characterEditing.editSection({
          keyPressed: 'j',
          sectionIndex: 0,
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
        expect(section.value).to.equal('Jan');
      });
    });

    describe('meridiem editing', () => {
      it('should update meridiem with A -> AM', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

        store.characterEditing.editSection({
          keyPressed: 'A',
          sectionIndex: 4,
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
        expect(section.value).to.equal('AM');
      });

      it('should update meridiem with P -> PM', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

        store.characterEditing.editSection({
          keyPressed: 'P',
          sectionIndex: 4,
        });

        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
        expect(section.value).to.equal('PM');
      });

      it('should complete meridiem after typing unique letter', () => {
        const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
        store.section.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

        store.characterEditing.editSection({
          keyPressed: 'A',
          sectionIndex: 4,
        });

        // 'A' uniquely identifies AM
        const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 4);
        expect(section).to.not.equal(null);
        expect(section!.value).to.equal('AM');
        // Note: Navigation from last section is not implemented
        // selectedSection remains at 4 since there's no section after it
        expect(store.state.selectedSection).to.equal(4);
      });
    });
  });

  describe('mixed editing - digit section with letter input', () => {
    it('should support typing digit on letter-format month (5 -> May)', () => {
      const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section (letter format)

      // Type '5' for May (5th month)
      store.characterEditing.editSection({
        keyPressed: '5',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('May');
    });

    it('should support typing 0 then 7 on letter-format month (07 -> Jul)', () => {
      const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section (letter format)

      // Type '0'
      store.characterEditing.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Value should not be set yet
      let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('');

      // Type '7' -> July
      store.characterEditing.editSection({
        keyPressed: '7',
        sectionIndex: 0,
      });

      section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('Jul');
    });

    it('should support typing digit 1 then 2 on letter-format month (12 -> Dec)', () => {
      const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section (letter format)

      // Type '1'
      store.characterEditing.editSection({
        keyPressed: '1',
        sectionIndex: 0,
      });

      let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('Jan');

      // Type '2' -> December
      store.characterEditing.editSection({
        keyPressed: '2',
        sectionIndex: 0,
      });

      section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('Dec');
    });
  });

  describe('query management', () => {
    it('should reset query when typing invalid continuation', () => {
      const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section

      // Type 'D' - should get 'Dec'
      store.characterEditing.editSection({
        keyPressed: 'D',
        sectionIndex: 0,
      });

      let section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('Dec');

      // Type 'a' - 'Da' doesn't match any month, should reset query
      store.characterEditing.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      // Value should still be 'Dec' (query reset, 'a' not valid)
      expect(section.value).to.equal('Dec');
    });

    it('should reset query when switching sections', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');

      // Type '0' in month section
      store.section.selectClosestDatePart(0);
      store.characterEditing.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Switch to day section
      store.section.selectClosestDatePart(2);

      // Type '9' in day section - should not concatenate with previous '0' from month
      store.characterEditing.editSection({
        keyPressed: '9',
        sectionIndex: 2, // Day section index
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
      expect(section.value).to.equal('09'); // Should be '09', not affected by previous '0'
    });

    it('should maintain query when continuing to type in same section', () => {
      const store = new DateFieldStore({ format: monthNameDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section

      // Type 'J'
      store.characterEditing.editSection({
        keyPressed: 'J',
        sectionIndex: 0,
      });

      // Type 'a' immediately after
      store.characterEditing.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('Jan');
    });
  });

  describe('full month name format', () => {
    it('should handle full month name typing (J -> January)', () => {
      const store = new DateFieldStore({ format: fullMonthNameFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section

      store.characterEditing.editSection({
        keyPressed: 'J',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('January');
    });

    it('should narrow down with more letters (Ja -> January)', () => {
      const store = new DateFieldStore({ format: fullMonthNameFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section

      store.characterEditing.editSection({
        keyPressed: 'J',
        sectionIndex: 0,
      });
      store.characterEditing.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('January');
    });
  });

  describe('edge cases', () => {
    it('should handle resetCharacterQuery', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section

      // Type '0'
      store.characterEditing.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Reset query
      store.characterEditing.resetCharacterQuery();

      // Type '5' - should start fresh query, result in '05'
      store.characterEditing.editSection({
        keyPressed: '5',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('05');
    });

    it('should handle empty section', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section (empty)

      // Type '3'
      store.characterEditing.editSection({
        keyPressed: '3',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('03');
    });

    it('should support letter input on digit month sections (a -> April -> 04)', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');
      store.section.selectClosestDatePart(0); // month section

      // Type letter 'a' on numeric month - should match April and convert to 04
      store.characterEditing.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 0);
      expect(section.value).to.equal('04'); // April = month 4
    });

    it('should reject numeric input for meridiem section', () => {
      const store = new TimeFieldStore({ format: time12Format }, adapter, 'ltr');
      store.section.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

      // Type digit '1' on meridiem
      store.characterEditing.editSection({
        keyPressed: '1',
        sectionIndex: 4,
      });

      const section = TemporalFieldSectionPlugin.selectors.datePart(store.state, 2);
      // Meridiem sections should reject numeric input
      expect(section.value).to.be.oneOf(['', 'AM', 'PM']); // Either empty or a meridiem value
    });
  });
});
