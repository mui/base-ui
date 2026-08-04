import { expect } from 'vitest';
import { DescribeGregorianAdapterTestSuite } from './describeGregorianAdapter.types';

export const testLocalization: DescribeGregorianAdapterTestSuite = ({ adapter, adapterFr }) => {
  it('Method: getCurrentLocaleCode', () => {
    // TODO: When adding the moment adapter
    // if (adapter.lib === 'moment') {
    //   moment.locale('en');
    // }

    // Returns the default locale
    expect(adapter.getCurrentLocaleCode()).toMatch(/en/);
  });

  describe('Method: matchMonth', () => {
    it('should read the full month name and return what follows it', () => {
      expect(adapter.matchMonth('March 15, 2024')).toEqual({ index: 2, rest: ' 15, 2024' });
    });

    it('should read the abbreviated month name', () => {
      expect(adapter.matchMonth('Mar 15, 2024')).toEqual({ index: 2, rest: ' 15, 2024' });
    });

    it('should ignore the case', () => {
      expect(adapter.matchMonth('MARCH 15, 2024')).toEqual({ index: 2, rest: ' 15, 2024' });
      expect(adapter.matchMonth('march 15, 2024')).toEqual({ index: 2, rest: ' 15, 2024' });
    });

    it('should return null when the value does not start with a month name', () => {
      expect(adapter.matchMonth('xyz 15, 2024')).toBe(null);
    });

    it('should use the locale of the adapter', () => {
      expect(adapterFr.matchMonth('mars 15')).toEqual({ index: 2, rest: ' 15' });
      expect(adapterFr.matchMonth('Mars 15')).toEqual({ index: 2, rest: ' 15' });
    });
  });

  describe('Method: matchWeekDay', () => {
    it('should index the week days from Sunday', () => {
      expect(adapter.matchWeekDay('Sunday 15')).toEqual({ index: 0, rest: ' 15' });
      expect(adapter.matchWeekDay('Friday 15')).toEqual({ index: 5, rest: ' 15' });
    });

    it('should read the abbreviated week day name', () => {
      expect(adapter.matchWeekDay('Fri 15')).toEqual({ index: 5, rest: ' 15' });
    });

    it('should return null when the value does not start with a week day name', () => {
      expect(adapter.matchWeekDay('xyz 15')).toBe(null);
    });

    it('should use the locale of the adapter', () => {
      expect(adapterFr.matchWeekDay('vendredi 15')).toEqual({ index: 5, rest: ' 15' });
    });
  });

  describe('Method: matchMeridiem', () => {
    it('should return 0 for AM and 1 for PM', () => {
      expect(adapter.matchMeridiem('AM 15')).toEqual({ index: 0, rest: ' 15' });
      expect(adapter.matchMeridiem('PM 15')).toEqual({ index: 1, rest: ' 15' });
    });

    it('should ignore the case', () => {
      expect(adapter.matchMeridiem('pm')).toEqual({ index: 1, rest: '' });
    });

    it('should return null when the value does not start with a meridiem', () => {
      expect(adapter.matchMeridiem('xyz')).toBe(null);
    });
  });
};
