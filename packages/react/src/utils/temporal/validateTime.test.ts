import { expect } from 'chai';
import { TemporalAdapter } from '@base-ui/react/types';
import { TemporalAdapterDateFns } from '../../temporal-adapter-date-fns';
import { TemporalAdapterLuxon } from '../../temporal-adapter-luxon';
import { validateTime } from './validateTime';

// @ts-expect-error
const adapters: TemporalAdapter[] = [new TemporalAdapterDateFns(), new TemporalAdapterLuxon()];

adapters.forEach((adapter) => {
  describe(`${adapter.constructor.name}: validateTime`, () => {
    it('should return null when value is null', () => {
      expect(
        validateTime({
          adapter,
          value: null,
          validationProps: {},
        }),
      ).to.equal(null);
    });

    it('should return null when no minDate and no maxDate are provided', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {},
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is between the minDate and the maxDate', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-03T08:00', 'default'),
            maxDate: adapter.date('2025-06-03T12:00', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value equals the minDate time', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value equals the maxDate time', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            maxDate: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it("should return 'before-min-time' when value time is before minDate time", () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T08:00', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal('before-min-time');
    });

    it("should return 'after-max-time' when value time is after maxDate time", () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T14:00', 'default'),
          validationProps: {
            maxDate: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal('after-max-time');
    });

    it("should return 'invalid' when receiving an invalid date", () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('Invalid date', 'default'),
          validationProps: {},
        }),
      ).to.equal('invalid');
    });

    it('should return null when minDate is provided but invalid', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minDate: adapter.date('Invalid date', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when maxDate is provided but invalid', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            maxDate: adapter.date('Invalid date', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should only compare time portion (ignore date part)', () => {
      // Same time but different dates - should pass
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minDate: adapter.date('2025-01-01T08:00', 'default'),
            maxDate: adapter.date('2025-12-31T12:00', 'default'),
          },
        }),
      ).to.equal(null);

      // Value time is before minDate time (regardless of date)
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-12-31T07:00', 'default'),
          validationProps: {
            minDate: adapter.date('2025-01-01T08:00', 'default'),
          },
        }),
      ).to.equal('before-min-time');

      // Value time is after maxDate time (regardless of date)
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-01-01T14:00', 'default'),
          validationProps: {
            maxDate: adapter.date('2025-12-31T12:00', 'default'),
          },
        }),
      ).to.equal('after-max-time');
    });
  });
});
