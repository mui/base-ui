import { expect } from 'chai';
import { spy } from 'sinon';
import { createTemporalRenderer } from '#test-utils';
import { TemporalFieldStore } from './TemporalFieldStore';
import { dateFieldConfig } from '../root/dateFieldConfig';
import { timeFieldConfig } from '../../time-field/root/timeFieldConfig';
import { selectors } from './selectors';
import { createDefaultStoreParameters } from './TemporalFieldStore.test-utils';

describe('TemporalFieldStore - Value', () => {
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;

  const DEFAULT_PARAMETERS = createDefaultStoreParameters(adapter, numericDateFormat);

  describe('publish', () => {
    describe('uncontrolled mode', () => {
      it('should update store value when no controlled value prop is provided', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const newDate = adapter.date('2024-06-15', 'default');
        store.publish(newDate);

        expect(adapter.isValid(store.state.value)).to.equal(true);
        expect(adapter.getMonth(store.state.value!)).to.equal(5); // June (0-indexed)
        expect(adapter.getDate(store.state.value!)).to.equal(15);
      });

      it('should update sections to match new value', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const newDate = adapter.date('2024-06-15', 'default');
        store.publish(newDate);

        const sections = selectors.sections(store.state);
        const dateParts = sections.filter((s) => s.type === 'datePart');
        expect(dateParts[0].value).to.equal('06'); // month
        expect(dateParts[1].value).to.equal('15'); // day
        expect(dateParts[2].value).to.equal('2024'); // year
      });
    });

    describe('controlled mode', () => {
      it('should call onValueChange but not update store value when value prop is set', () => {
        const onValueChangeSpy = spy();
        const controlledValue = adapter.date('2024-01-01', 'default');
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            value: controlledValue,
            onValueChange: onValueChangeSpy,
          },
          dateFieldConfig,
        );

        const newDate = adapter.date('2024-06-15', 'default');
        store.publish(newDate);

        // onValueChange should be called
        expect(onValueChangeSpy.callCount).to.equal(1);
        // Store value should NOT be updated (controlled)
        expect(adapter.getMonth(store.state.value!)).to.equal(0); // January, unchanged
      });
    });

    describe('onValueChange callback', () => {
      it('should call onValueChange with the new value', () => {
        const onValueChangeSpy = spy();
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            onValueChange: onValueChangeSpy,
          },
          dateFieldConfig,
        );

        const newDate = adapter.date('2024-06-15', 'default');
        store.publish(newDate);

        expect(onValueChangeSpy.callCount).to.equal(1);
        expect(adapter.isValid(onValueChangeSpy.firstCall.args[0])).to.equal(true);
      });

      it('should pass event details as second argument', () => {
        const onValueChangeSpy = spy();
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            onValueChange: onValueChangeSpy,
          },
          dateFieldConfig,
        );

        store.publish(adapter.date('2024-06-15', 'default'));

        expect(onValueChangeSpy.firstCall.args[1]).to.not.equal(undefined);
      });
    });
  });

  describe('updateFromString', () => {
    it('should parse a date string and update the value', () => {
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

      store.updateFromString('06/15/2024');

      expect(adapter.isValid(store.state.value)).to.equal(true);
      expect(adapter.getMonth(store.state.value!)).to.equal(5);
      expect(adapter.getDate(store.state.value!)).to.equal(15);
      expect(adapter.getYear(store.state.value!)).to.equal(2024);
    });

    it('should parse a time string and update the value', () => {
      const store = new TemporalFieldStore(
        { ...DEFAULT_PARAMETERS, format: time24Format },
        timeFieldConfig,
      );

      store.updateFromString('14:30');

      expect(adapter.isValid(store.state.value)).to.equal(true);
      expect(adapter.getHours(store.state.value!)).to.equal(14);
      expect(adapter.getMinutes(store.state.value!)).to.equal(30);
    });

    it('should call onValueChange when parsing a valid string', () => {
      const onValueChangeSpy = spy();
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          onValueChange: onValueChangeSpy,
        },
        dateFieldConfig,
      );

      store.updateFromString('06/15/2024');

      expect(onValueChangeSpy.callCount).to.equal(1);
    });
  });

  describe('clear', () => {
    it('should set value to null when value is non-null', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-06-15', 'default'),
        },
        dateFieldConfig,
      );

      expect(store.state.value).to.not.equal(null);
      store.clear();
      expect(store.state.value).to.equal(null);
    });

    it('should call onValueChange with null when clearing', () => {
      const onValueChangeSpy = spy();
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-06-15', 'default'),
          onValueChange: onValueChangeSpy,
        },
        dateFieldConfig,
      );

      store.clear();
      expect(onValueChangeSpy.callCount).to.equal(1);
      expect(onValueChangeSpy.firstCall.args[0]).to.equal(null);
    });

    it('should clear section values when value is already null (double-clear)', () => {
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

      // First set some section values without creating a complete date
      store.selectClosestDatePart(0);
      store.updateDatePart({
        sectionIndex: 0,
        newDatePartValue: '03',
        shouldGoToNextSection: false,
      });

      // Value is still null (not all sections filled)
      // Clear should empty the section values
      store.clear();

      const sections = selectors.sections(store.state);
      const dateParts = sections.filter((s) => s.type === 'datePart');
      dateParts.forEach((section) => {
        expect(section.value).to.equal('');
      });
    });

    it('should work with TimeFieldStore', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time24Format,
          defaultValue: adapter.date('2024-06-15T14:30', 'default'),
        },
        timeFieldConfig,
      );

      expect(store.state.value).to.not.equal(null);
      store.clear();
      expect(store.state.value).to.equal(null);
    });
  });

  describe('deriveStateFromNewValue', () => {
    it('should rebuild sections from a valid new value', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-01-01', 'default'),
        },
        dateFieldConfig,
      );

      const newDate = adapter.date('2024-06-15', 'default');
      const derived = store.deriveStateFromNewValue(newDate);

      // Should have sections matching the new date
      const dateParts = derived.sections.filter((s) => s.type === 'datePart');
      expect(dateParts[0].value).to.equal('06'); // month
      expect(dateParts[1].value).to.equal('15'); // day
      expect(dateParts[2].value).to.equal('2024'); // year
    });

    it('should update reference value for a valid date', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-01-01', 'default'),
        },
        dateFieldConfig,
      );

      const newDate = adapter.date('2024-06-15', 'default');
      const derived = store.deriveStateFromNewValue(newDate);

      expect(adapter.isValid(derived.referenceValue)).to.equal(true);
    });

    it('should return sections with empty values for null value', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-01-01', 'default'),
        },
        dateFieldConfig,
      );

      const derived = store.deriveStateFromNewValue(null as any);

      const dateParts = derived.sections.filter((s) => s.type === 'datePart');
      dateParts.forEach((section) => {
        expect(section.value).to.equal('');
      });
    });
  });
});
