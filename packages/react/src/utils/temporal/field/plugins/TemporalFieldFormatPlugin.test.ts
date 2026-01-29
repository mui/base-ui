import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../../time-field/root/TimeFieldStore';
import { TemporalFieldFormatPlugin } from './TemporalFieldFormatPlugin';
import { isToken } from '../utils';

describe('TemporalFieldFormatPlugin', () => {
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;

  describe('selectors', () => {
    describe('format', () => {
      it('should return the format string from state', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });

        expect(TemporalFieldFormatPlugin.selectors.format(store.state)).to.equal(numericDateFormat);
      });

      it('should return custom format when provided', () => {
        const customFormat = `${adapter.formats.yearPadded}-${adapter.formats.monthPadded}-${adapter.formats.dayOfMonthPadded}`;
        const store = new DateFieldStore({
          format: customFormat,
          adapter,
          direction: 'ltr',
        });

        expect(TemporalFieldFormatPlugin.selectors.format(store.state)).to.equal(customFormat);
      });
    });

    describe('parsedFormat', () => {
      it('should return a parsed format with correct number of elements for date format', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });

        const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(store.state);
        // MM/DD/YYYY = 5 elements: month, separator, day, separator, year
        expect(parsedFormat.elements).to.have.length(5);
      });

      it('should return a parsed format with correct number of elements for time format', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
        });

        const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(store.state);
        // HH:mm = 3 elements: hours, separator, minutes
        expect(parsedFormat.elements).to.have.length(3);
      });

      it('should return correct granularity for date format', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });

        const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(store.state);
        // The most granular part in MM/DD/YYYY is 'day'
        expect(parsedFormat.granularity).to.equal('day');
      });

      it('should return correct granularity for time format', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          adapter,
          direction: 'ltr',
        });

        const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(store.state);
        // The most granular part in HH:mm is 'minutes'
        expect(parsedFormat.granularity).to.equal('minutes');
      });

      it('should identify tokens correctly in parsed format', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
        });

        const parsedFormat = TemporalFieldFormatPlugin.selectors.parsedFormat(store.state);
        const tokens = parsedFormat.elements.filter(isToken);
        expect(tokens).to.have.length(3); // month, day, year
      });
    });
  });
});
