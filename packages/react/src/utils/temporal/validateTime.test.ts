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

    it('should return null when no minTime and no maxTime are provided', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {},
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is between the minTime and the maxTime', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minTime: adapter.date('2025-06-03T08:00', 'default'),
            maxTime: adapter.date('2025-06-03T12:00', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value equals the minTime', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minTime: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value equals the maxTime', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            maxTime: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it("should return 'before-min-time' when value is before minTime", () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T08:00', 'default'),
          validationProps: {
            minTime: adapter.date('2025-06-03T10:30', 'default'),
          },
        }),
      ).to.equal('before-min-time');
    });

    it("should return 'after-max-time' when value is after maxTime", () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T14:00', 'default'),
          validationProps: {
            maxTime: adapter.date('2025-06-03T10:30', 'default'),
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

    it('should return null when minTime is provided but invalid', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            minTime: adapter.date('Invalid date', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when maxTime is provided but invalid', () => {
      expect(
        validateTime({
          adapter,
          value: adapter.date('2025-06-03T10:30', 'default'),
          validationProps: {
            maxTime: adapter.date('Invalid date', 'default'),
          },
        }),
      ).to.equal(null);
    });
  });
});
