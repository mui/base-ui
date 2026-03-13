import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { TemporalFieldStore } from './TemporalFieldStore';
import { dateFieldConfig } from '../root/dateFieldConfig';
import { timeFieldConfig } from '../../time-field/root/timeFieldConfig';
import { selectors } from './selectors';
import { isToken } from './utils';
import { createDefaultStoreParameters } from './TemporalFieldStore.test-utils';

describe('TemporalFieldStore - Format', () => {
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;

  const DEFAULT_PARAMETERS = createDefaultStoreParameters(adapter, numericDateFormat);

  describe('selectors', () => {
    describe('format', () => {
      it('should return the raw format string', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        expect(store.state.rawFormat).to.equal(numericDateFormat);
      });

      it('should return custom format when provided', () => {
        const customFormat = `${adapter.formats.yearPadded}-${adapter.formats.monthPadded}-${adapter.formats.dayOfMonthPadded}`;
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: customFormat },
          dateFieldConfig,
        );

        expect(store.state.rawFormat).to.equal(customFormat);
      });

      it('should return a parsed format with correct number of elements for date format', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const format = selectors.format(store.state);
        // MM/DD/YYYY = 5 elements: month, separator, day, separator, year
        expect(format.elements).to.have.length(5);
      });

      it('should return a parsed format with correct number of elements for time format', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: time24Format },
          timeFieldConfig,
        );

        const format = selectors.format(store.state);
        // HH:mm = 3 elements: hours, separator, minutes
        expect(format.elements).to.have.length(3);
      });

      it('should return correct granularity for date format', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const format = selectors.format(store.state);
        // The most granular part in MM/DD/YYYY is 'day'
        expect(format.granularity).to.equal('day');
      });

      it('should return correct granularity for time format', () => {
        const store = new TemporalFieldStore(
          { ...DEFAULT_PARAMETERS, format: time24Format },
          timeFieldConfig,
        );

        const format = selectors.format(store.state);
        // The most granular part in HH:mm is 'minutes'
        expect(format.granularity).to.equal('minutes');
      });

      it('should identify tokens correctly in parsed format', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const format = selectors.format(store.state);
        const tokens = format.elements.filter(isToken);
        expect(tokens).to.have.length(3); // month, day, year
      });
    });
  });
});
