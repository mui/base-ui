import { expect } from 'chai';
import { TemporalAdapter } from '@base-ui/react/types';
import { TemporalAdapterDateFns } from '../../temporal-adapter-date-fns';
import { TemporalAdapterLuxon } from '../../temporal-adapter-luxon';
import { validateDate } from './validateDate';

// @ts-expect-error
const adapters: TemporalAdapter[] = [new TemporalAdapterDateFns(), new TemporalAdapterLuxon()];

adapters.forEach((adapter) => {
  describe(`${adapter.constructor.name}: validateDate`, () => {
    it('should return null when no min date and not max date are provided', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03', 'default'),
          validationProps: {},
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is between the min date and the max date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-01', 'default'),
            maxDate: adapter.date('2025-06-05', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is on the same day as the min date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03T15:30', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-03T20:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is on the same day as the max date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03T20:30', 'default'),
          validationProps: {
            maxDate: adapter.date('2025-06-03T15:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return "invalid" when receiving an invalid date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('Invalid date', 'default'),
          validationProps: {},
        }),
      ).to.equal('invalid');
    });
  });
});
