import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { TemporalFieldStore } from './TemporalFieldStore';
import { dateFieldConfig } from '../root/dateFieldConfig';
import { timeFieldConfig } from '../../time-field/root/timeFieldConfig';
import { selectors } from './selectors';
import { createDefaultStoreParameters } from './TemporalFieldStore.test-utils';

describe('TemporalFieldStore - Character Editing', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const monthNameDateFormat = `${adapter.formats.month3Letters} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;
  const fullMonthNameFormat = `${adapter.formats.monthFullLetter} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;

  // Time formats
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  const DEFAULT_PARAMETERS = createDefaultStoreParameters(adapter, numericDateFormat);

  describe('numeric editing - digit sections', () => {
    describe('single digit entry', () => {
      it('should update month section with single digit', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(0); // month section

        store.editSection({
          keyPressed: '5',
          sectionIndex: 0,
        });

        const datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('05');
      });

      it('should update day section with single digit', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(2); // day section (index 2 because of separator at index 1)

        store.editSection({
          keyPressed: '7',
          sectionIndex: 2, // Full section index for day
        });

        const datePart = selectors.datePart(store.state, 2);
        expect(datePart!.value).to.equal('07');
      });

      it('should update year section with single digit', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(4); // year section (index 4 because of separators)

        store.editSection({
          keyPressed: '2',
          sectionIndex: 4, // Full section index (not datePart index)
        });

        const datePart = selectors.datePart(store.state, 4);
        expect(datePart!.value).to.equal('0002');
      });
    });

    describe('multi-digit entry with concatenation', () => {
      it('should concatenate digits for month (0 then 9)', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(0); // month section

        // Type '0'
        store.editSection({
          keyPressed: '0',
          sectionIndex: 0,
        });

        // Value should not be set yet (0 is below minimum)
        let datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('');

        // Type '9'
        store.editSection({
          keyPressed: '9',
          sectionIndex: 0,
        });

        datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('09');
      });

      it('should concatenate digits for day (1 then 5)', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(2); // day section (index 2 because of separator at index 1)

        // Type '1'
        store.editSection({
          keyPressed: '1',
          sectionIndex: 2, // Day section index
        });

        let datePart = selectors.datePart(store.state, 2);
        expect(datePart!.value).to.equal('01');

        // Type '5'
        store.editSection({
          keyPressed: '5',
          sectionIndex: 2, // Day section index
        });

        datePart = selectors.datePart(store.state, 2);
        expect(datePart!.value).to.equal('15');
      });

      it('should concatenate digits for year (2, 0, 2, 4)', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(4); // year section (index 4 because of separators)

        const digits = ['2', '0', '2', '4'];
        digits.forEach((digit) => {
          store.editSection({
            keyPressed: digit,
            sectionIndex: 4,
          });
        });

        const datePart = selectors.datePart(store.state, 4);
        expect(datePart!.value).to.equal('2024');
      });
    });

    describe('boundary validation', () => {
      it('should reject month value above 12', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(0); // month section

        // Type '1' - should work
        store.editSection({
          keyPressed: '1',
          sectionIndex: 0,
        });
        let datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('01');

        // Type '5' - should be rejected (15 > 12)
        store.editSection({
          keyPressed: '5',
          sectionIndex: 0,
        });

        datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('01'); // Value should not change
      });

      it('should reject day value above 31', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(2); // day section (index 2 because of separator at index 1)

        // Type '3' - should work
        store.editSection({
          keyPressed: '3',
          sectionIndex: 2, // Day section index
        });
        let datePart = selectors.datePart(store.state, 2);
        expect(datePart!.value).to.equal('03');

        // Type '5' - should be rejected (35 > 31)
        store.editSection({
          keyPressed: '5',
          sectionIndex: 2, // Day section index
        });

        datePart = selectors.datePart(store.state, 2);
        expect(datePart!.value).to.equal('03'); // Value should not change
      });
    });

    describe('automatic navigation', () => {
      it('should move to next section when typing digit that would exceed maximum', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(0); // month section

        // Type '9' - should move to next section (9*10 = 90 > 12)
        store.editSection({
          keyPressed: '9',
          sectionIndex: 0,
        });

        expect(store.state.selectedSection).to.equal(2); // Should move to day section (index 2)
      });

      it('should complete year section after typing max length', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
        store.selectClosestDatePart(4); // year section (index 4 because of separators)

        // Type 4 digits
        const digits = ['2', '0', '2', '4'];
        digits.forEach((digit) => {
          store.editSection({
            keyPressed: digit,
            sectionIndex: 4,
          });
        });

        // Year should be fully entered
        const datePart = selectors.datePart(store.state, 4);
        expect(datePart).to.not.equal(null);
        expect(datePart!.value).to.equal('2024');
        // Note: Navigation from last section is not implemented
        // selectedSection remains at 4 since there's no section after it
        expect(store.state.selectedSection).to.equal(4);
      });
    });
  });

  describe('letter editing - letter sections', () => {
    describe('month name editing', () => {
      it('should update month section with letter (J -> Jan)', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
          dateFieldConfig,
        );
        store.selectClosestDatePart(0); // month section

        store.editSection({
          keyPressed: 'J',
          sectionIndex: 0,
        });

        const datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('Jan');
      });

      it('should concatenate letters for month (J then u -> Jun)', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
          dateFieldConfig,
        );
        store.selectClosestDatePart(0); // month section

        // Type 'J' - could be Jan, Jun, Jul
        store.editSection({
          keyPressed: 'J',
          sectionIndex: 0,
        });
        let datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('Jan'); // First match

        // Type 'u' - should narrow down to Jun or Jul
        store.editSection({
          keyPressed: 'u',
          sectionIndex: 0,
        });
        datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('Jun'); // First match for 'ju'
      });

      it('should complete and move to next section when only one match (Ju then l -> Jul)', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
          dateFieldConfig,
        );
        store.selectClosestDatePart(0); // month section

        // Type 'Jul' one by one
        store.editSection({
          keyPressed: 'J',
          sectionIndex: 0,
        });
        store.editSection({
          keyPressed: 'u',
          sectionIndex: 0,
        });
        store.editSection({
          keyPressed: 'l',
          sectionIndex: 0,
        });

        const datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('Jul');
        expect(store.state.selectedSection).to.equal(2); // Should move to next section (day at index 2)
      });

      it('should handle case-insensitive input', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
          dateFieldConfig,
        );
        store.selectClosestDatePart(0); // month section

        // Type lowercase 'j'
        store.editSection({
          keyPressed: 'j',
          sectionIndex: 0,
        });

        const datePart = selectors.datePart(store.state, 0);
        expect(datePart!.value).to.equal('Jan');
      });
    });

    describe('meridiem editing', () => {
      it('should update meridiem with A -> AM', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: time12Format },
          timeFieldConfig,
        );
        store.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

        store.editSection({
          keyPressed: 'A',
          sectionIndex: 4,
        });

        const datePart = selectors.datePart(store.state, 4);
        expect(datePart!.value).to.equal('AM');
      });

      it('should update meridiem with P -> PM', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: time12Format },
          timeFieldConfig,
        );
        store.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

        store.editSection({
          keyPressed: 'P',
          sectionIndex: 4,
        });

        const datePart = selectors.datePart(store.state, 4);
        expect(datePart!.value).to.equal('PM');
      });

      it('should complete meridiem after typing unique letter', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: time12Format },
          timeFieldConfig,
        );
        store.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

        store.editSection({
          keyPressed: 'A',
          sectionIndex: 4,
        });

        // 'A' uniquely identifies AM
        const datePart = selectors.datePart(store.state, 4);
        expect(datePart).to.not.equal(null);
        expect(datePart!.value).to.equal('AM');
        // Note: Navigation from last section is not implemented
        // selectedSection remains at 4 since there's no section after it
        expect(store.state.selectedSection).to.equal(4);
      });
    });
  });

  describe('mixed editing - digit section with letter input', () => {
    it('should support typing digit on letter-format month (5 -> May)', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section (letter format)

      // Type '5' for May (5th month)
      store.editSection({
        keyPressed: '5',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('May');
    });

    it('should support typing 0 then 7 on letter-format month (07 -> Jul)', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section (letter format)

      // Type '0'
      store.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Value should not be set yet
      let datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('');

      // Type '7' -> July
      store.editSection({
        keyPressed: '7',
        sectionIndex: 0,
      });

      datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('Jul');
    });

    it('should support typing digit 1 then 2 on letter-format month (12 -> Dec)', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section (letter format)

      // Type '1'
      store.editSection({
        keyPressed: '1',
        sectionIndex: 0,
      });

      let datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('Jan');

      // Type '2' -> December
      store.editSection({
        keyPressed: '2',
        sectionIndex: 0,
      });

      datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('Dec');
    });
  });

  describe('query management', () => {
    it('should reset query when typing invalid continuation', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section

      // Type 'D' - should get 'Dec'
      store.editSection({
        keyPressed: 'D',
        sectionIndex: 0,
      });

      let datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('Dec');

      // Type 'a' - 'Da' doesn't match any month, should reset query
      store.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      datePart = selectors.datePart(store.state, 0);
      // Value should still be 'Dec' (query reset, 'a' not valid)
      expect(datePart!.value).to.equal('Dec');
    });

    it('should reset query when switching sections', () => {
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

      // Type '0' in month section
      store.selectClosestDatePart(0);
      store.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Switch to day section
      store.selectClosestDatePart(2);

      // Type '9' in day section - should not concatenate with previous '0' from month
      store.editSection({
        keyPressed: '9',
        sectionIndex: 2, // Day section index
      });

      const datePart = selectors.datePart(store.state, 2);
      expect(datePart!.value).to.equal('09'); // Should be '09', not affected by previous '0'
    });

    it('should maintain query when continuing to type in same section', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: monthNameDateFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section

      // Type 'J'
      store.editSection({
        keyPressed: 'J',
        sectionIndex: 0,
      });

      // Type 'a' immediately after
      store.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('Jan');
    });
  });

  describe('full month name format', () => {
    it('should handle full month name typing (J -> January)', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: fullMonthNameFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section

      store.editSection({
        keyPressed: 'J',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('January');
    });

    it('should narrow down with more letters (Ja -> January)', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: fullMonthNameFormat },
        dateFieldConfig,
      );
      store.selectClosestDatePart(0); // month section

      store.editSection({
        keyPressed: 'J',
        sectionIndex: 0,
      });
      store.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('January');
    });
  });

  describe('edge cases', () => {
    it('should handle resetCharacterQuery', () => {
      vi.useFakeTimers();
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
      store.selectClosestDatePart(0); // month section

      // Type '0'
      store.editSection({
        keyPressed: '0',
        sectionIndex: 0,
      });

      // Advance past queryLifeDuration to trigger auto-cleanup
      vi.advanceTimersByTime(5000);

      // Type '5' - should start fresh query, result in '05'
      store.editSection({
        keyPressed: '5',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('05');

      vi.useRealTimers();
    });

    it('should handle empty section', () => {
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
      store.selectClosestDatePart(0); // month section (empty)

      // Type '3'
      store.editSection({
        keyPressed: '3',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('03');
    });

    it('should support letter input on digit month sections (a -> April -> 04)', () => {
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);
      store.selectClosestDatePart(0); // month section

      // Type letter 'a' on numeric month - should match April and convert to 04
      store.editSection({
        keyPressed: 'a',
        sectionIndex: 0,
      });

      const datePart = selectors.datePart(store.state, 0);
      expect(datePart!.value).to.equal('04'); // April = month 4
    });

    it('should reject numeric input for meridiem section', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: time12Format },
        timeFieldConfig,
      );
      store.selectClosestDatePart(4); // meridiem section (index 4 because of separators)

      // Type digit '1' on meridiem
      store.editSection({
        keyPressed: '1',
        sectionIndex: 4,
      });

      const datePart = selectors.datePart(store.state, 4);
      // Meridiem sections should reject numeric input
      expect(datePart!.value).to.equal('');
    });
  });
});
