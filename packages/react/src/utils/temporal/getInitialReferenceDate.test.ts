import { expect } from 'chai';
import { TemporalAdapterDateFns } from '../../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { getInitialReferenceDate } from './getInitialReferenceDate';

describe('getInitialReferenceDate', () => {
  const adapter = new TemporalAdapterDateFns();

  describe('when externalDate is provided and valid', () => {
    it('should return externalDate', () => {
      const externalDate = adapter.date('2025-03-15', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate,
        externalReferenceDate: null,
        validationProps: {},
      });

      expect(adapter.isEqual(result, externalDate)).to.equal(true);
    });

    it('should return externalDate even if externalReferenceDate is also provided', () => {
      const externalDate = adapter.date('2025-03-15', 'default');
      const externalReferenceDate = adapter.date('2025-04-20', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate,
        externalReferenceDate,
        validationProps: {},
      });

      expect(adapter.isEqual(result, externalDate)).to.equal(true);
    });

    it('should return externalDate even if it is outside minDate/maxDate bounds', () => {
      const externalDate = adapter.date('2025-01-15', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate,
        externalReferenceDate: null,
        validationProps: {
          minDate: adapter.date('2025-02-01', 'default'),
          maxDate: adapter.date('2025-12-31', 'default'),
        },
      });

      // externalDate is returned as-is, validation bounds don't apply
      expect(adapter.isEqual(result, externalDate)).to.equal(true);
    });
  });

  describe('when externalReferenceDate is provided and valid (no externalDate)', () => {
    it('should return externalReferenceDate', () => {
      const externalReferenceDate = adapter.date('2025-04-20', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate,
        validationProps: {},
      });

      expect(adapter.isEqual(result, externalReferenceDate)).to.equal(true);
    });

    it('should return externalReferenceDate even if it is outside minDate/maxDate bounds', () => {
      const externalReferenceDate = adapter.date('2025-01-15', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate,
        validationProps: {
          minDate: adapter.date('2025-02-01', 'default'),
          maxDate: adapter.date('2025-12-31', 'default'),
        },
      });

      // externalReferenceDate is returned as-is, validation bounds don't apply
      expect(adapter.isEqual(result, externalReferenceDate)).to.equal(true);
    });
  });

  describe('when neither externalDate nor externalReferenceDate is provided', () => {
    it('should return the current date (start of day)', () => {
      // Set a fixed time for this test
      vi.setSystemTime(new Date('2025-06-15T14:30:00.000Z'));

      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: {},
      });

      const expectedDate = adapter.startOfDay(adapter.date('2025-06-15', 'default'));
      expect(adapter.isEqual(result, expectedDate)).to.equal(true);

      vi.useRealTimers();
    });

    it('should clamp to minDate if current date is before minDate', () => {
      vi.setSystemTime(new Date('2025-01-15T14:30:00.000Z'));

      const minDate = adapter.date('2025-02-01', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: { minDate },
      });

      expect(adapter.isEqual(result, minDate)).to.equal(true);

      vi.useRealTimers();
    });

    it('should clamp to maxDate if current date is after maxDate', () => {
      vi.setSystemTime(new Date('2025-12-15T14:30:00.000Z'));

      const maxDate = adapter.date('2025-06-30', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: { maxDate },
      });

      expect(adapter.isEqual(result, maxDate)).to.equal(true);

      vi.useRealTimers();
    });

    it('should return current date if it is within minDate/maxDate bounds', () => {
      vi.setSystemTime(new Date('2025-06-15T14:30:00.000Z'));

      const minDate = adapter.date('2025-01-01', 'default');
      const maxDate = adapter.date('2025-12-31', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: { minDate, maxDate },
      });

      const expectedDate = adapter.startOfDay(adapter.date('2025-06-15', 'default'));
      expect(adapter.isEqual(result, expectedDate)).to.equal(true);

      vi.useRealTimers();
    });
  });

  describe('timezone handling', () => {
    it('should set the timezone on the returned date', () => {
      const externalDate = adapter.date('2025-03-15', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'UTC',
        externalDate,
        externalReferenceDate: null,
        validationProps: {},
      });

      expect(adapter.getTimezone(result)).to.equal('UTC');
    });

    it('should set the timezone when using externalReferenceDate', () => {
      const externalReferenceDate = adapter.date('2025-04-20', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'UTC',
        externalDate: null,
        externalReferenceDate,
        validationProps: {},
      });

      expect(adapter.getTimezone(result)).to.equal('UTC');
    });

    it('should set the timezone when falling back to current date', () => {
      vi.setSystemTime(new Date('2025-06-15T14:30:00.000Z'));

      const result = getInitialReferenceDate({
        adapter,
        timezone: 'UTC',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: {},
      });

      expect(adapter.getTimezone(result)).to.equal('UTC');

      vi.useRealTimers();
    });
  });

  describe('invalid dates handling', () => {
    it('should fall back to externalReferenceDate if externalDate is invalid', () => {
      const externalReferenceDate = adapter.date('2025-04-20', 'default');
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: new Date('invalid'),
        externalReferenceDate,
        validationProps: {},
      });

      expect(adapter.isEqual(result, externalReferenceDate)).to.equal(true);
    });

    it('should fall back to current date if both externalDate and externalReferenceDate are invalid', () => {
      vi.setSystemTime(new Date('2025-06-15T14:30:00.000Z'));

      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: new Date('invalid'),
        externalReferenceDate: new Date('also-invalid'),
        validationProps: {},
      });

      const expectedDate = adapter.startOfDay(adapter.date('2025-06-15', 'default'));
      expect(adapter.isEqual(result, expectedDate)).to.equal(true);

      vi.useRealTimers();
    });
  });
});
