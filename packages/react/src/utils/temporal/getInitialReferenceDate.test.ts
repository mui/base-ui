import { expect } from 'chai';
import { TemporalAdapterDateFns } from '../../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { getInitialReferenceDate } from './getInitialReferenceDate';

describe('getInitialReferenceDate', () => {
  const adapter = new TemporalAdapterDateFns();

  describe('when externalDate is provided and valid', () => {
    it('should return externalDate', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: adapter.date('2025-03-15', 'default'),
        externalReferenceDate: null,
        validationProps: {},
      });

      expect(result).toEqualDateTime('2025-03-15');
    });

    it('should return externalDate even if externalReferenceDate is also provided', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: adapter.date('2025-03-15', 'default'),
        externalReferenceDate: adapter.date('2025-04-20', 'default'),
        validationProps: {},
      });

      expect(result).toEqualDateTime('2025-03-15');
    });

    it('should return externalDate even if it is outside minDate/maxDate bounds', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: adapter.date('2025-01-15', 'default'),
        externalReferenceDate: null,
        validationProps: {
          minDate: adapter.date('2025-02-01', 'default'),
          maxDate: adapter.date('2025-12-31', 'default'),
        },
      });

      // externalDate is returned as-is, validation bounds don't apply
      expect(result).toEqualDateTime('2025-01-15');
    });
  });

  describe('when externalReferenceDate is provided and valid (no externalDate)', () => {
    it('should return externalReferenceDate', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: adapter.date('2025-04-20', 'default'),
        validationProps: {},
      });

      expect(result).toEqualDateTime('2025-04-20');
    });

    it('should return externalReferenceDate even if it is outside minDate/maxDate bounds', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: adapter.date('2025-01-15', 'default'),
        validationProps: {
          minDate: adapter.date('2025-02-01', 'default'),
          maxDate: adapter.date('2025-12-31', 'default'),
        },
      });

      // externalReferenceDate is returned as-is, validation bounds don't apply
      expect(result).toEqualDateTime('2025-01-15');
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

      expect(result).toEqualDateTime('2025-06-15');
      vi.useRealTimers();
    });

    it('should clamp to minDate if current date is before minDate', () => {
      vi.setSystemTime(new Date('2025-01-15T14:30:00.000Z'));

      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: { minDate: adapter.date('2025-02-01', 'default') },
      });

      expect(result).toEqualDateTime('2025-02-01');
      vi.useRealTimers();
    });

    it('should clamp to maxDate if current date is after maxDate', () => {
      vi.setSystemTime(new Date('2025-12-15T14:30:00.000Z'));

      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: { maxDate: adapter.date('2025-06-30', 'default') },
      });

      expect(result).toEqualDateTime('2025-06-30');
      vi.useRealTimers();
    });

    it('should return current date if it is within minDate/maxDate bounds', () => {
      vi.setSystemTime(new Date('2025-06-15T14:30:00.000Z'));

      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: null,
        externalReferenceDate: null,
        validationProps: {
          minDate: adapter.date('2025-01-01', 'default'),
          maxDate: adapter.date('2025-12-31', 'default'),
        },
      });

      expect(result).toEqualDateTime('2025-06-15');
      vi.useRealTimers();
    });
  });

  describe('timezone handling', () => {
    it('should set the timezone on the returned date', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'UTC',
        externalDate: adapter.date('2025-03-15', 'default'),
        externalReferenceDate: null,
        validationProps: {},
      });

      expect(adapter.getTimezone(result)).to.equal('UTC');
    });

    it('should set the timezone when using externalReferenceDate', () => {
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'UTC',
        externalDate: null,
        externalReferenceDate: adapter.date('2025-04-20', 'default'),
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
      const result = getInitialReferenceDate({
        adapter,
        timezone: 'default',
        externalDate: new Date('invalid'),
        externalReferenceDate: adapter.date('2025-04-20', 'default'),
        validationProps: {},
      });

      expect(result).toEqualDateTime('2025-04-20');
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

      expect(result).toEqualDateTime('2025-06-15');
      vi.useRealTimers();
    });
  });
});
