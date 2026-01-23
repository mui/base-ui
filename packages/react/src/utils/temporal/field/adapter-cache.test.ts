import { createTemporalRenderer } from '#test-utils';
import {
  getWeekDaysStr,
  getMonthsStr,
  getMeridiemsStr,
  getLongestMonthInCurrentYear,
  getLocalizedDigits,
} from './adapter-cache';

describe('getWeekDaysStr', () => {
  const { adapter } = createTemporalRenderer();

  it('should return abbreviated weekday names', () => {
    const result = getWeekDaysStr(adapter, adapter.formats.weekday3Letters);

    expect(result).to.deep.equal(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('should return full weekday names', () => {
    const result = getWeekDaysStr(adapter, adapter.formats.weekday);

    expect(result).to.deep.equal([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });

  it('should return single-letter weekday names', () => {
    const result = getWeekDaysStr(adapter, adapter.formats.weekday1Letter);

    expect(result).to.deep.equal(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });

  it('should return the same reference when called twice with the same format', () => {
    const result1 = getWeekDaysStr(adapter, adapter.formats.weekday3Letters);
    const result2 = getWeekDaysStr(adapter, adapter.formats.weekday3Letters);

    expect(result1).to.equal(result2);
  });

  it('should return different references for different formats', () => {
    const result1 = getWeekDaysStr(adapter, adapter.formats.weekday3Letters);
    const result2 = getWeekDaysStr(adapter, adapter.formats.weekday);

    expect(result1).to.not.equal(result2);
  });
});

describe('getMonthsStr', () => {
  const { adapter } = createTemporalRenderer();

  it('should return abbreviated month names', () => {
    const result = getMonthsStr(adapter, adapter.formats.month3Letters);

    expect(result).to.deep.equal([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]);
  });

  it('should return full month names', () => {
    const result = getMonthsStr(adapter, adapter.formats.monthFullLetter);

    expect(result).to.deep.equal([
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
  });

  it('should return the same reference when called twice with the same format', () => {
    const result1 = getMonthsStr(adapter, adapter.formats.month3Letters);
    const result2 = getMonthsStr(adapter, adapter.formats.month3Letters);

    expect(result1).to.equal(result2);
  });

  it('should return different references for different formats', () => {
    const result1 = getMonthsStr(adapter, adapter.formats.month3Letters);
    const result2 = getMonthsStr(adapter, adapter.formats.monthFullLetter);

    expect(result1).to.not.equal(result2);
  });
});

describe('getMeridiemsStr', () => {
  const { adapter } = createTemporalRenderer();

  it('should return AM and PM', () => {
    const result = getMeridiemsStr(adapter, adapter.formats.meridiem);

    expect(result).to.deep.equal(['AM', 'PM']);
  });

  it('should return the same reference when called twice with the same format', () => {
    const result1 = getMeridiemsStr(adapter, adapter.formats.meridiem);
    const result2 = getMeridiemsStr(adapter, adapter.formats.meridiem);

    expect(result1).to.equal(result2);
  });
});

describe('getLongestMonthInCurrentYear', () => {
  const { adapter } = createTemporalRenderer();

  it('should return a valid date', () => {
    const result = getLongestMonthInCurrentYear(adapter);

    expect(adapter.isValid(result)).to.equal(true);
  });

  it('should return a month with 31 days', () => {
    const result = getLongestMonthInCurrentYear(adapter);

    expect(adapter.getDaysInMonth(result)).to.equal(31);
  });

  it('should return the same reference when called twice', () => {
    const result1 = getLongestMonthInCurrentYear(adapter);
    const result2 = getLongestMonthInCurrentYear(adapter);

    expect(result1).to.equal(result2);
  });
});

describe('getLocalizedDigits', () => {
  const { adapter } = createTemporalRenderer();

  it('should return standard digits for the default locale', () => {
    const result = getLocalizedDigits(adapter);

    expect(result).to.deep.equal(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  it('should return the same reference when called twice', () => {
    const result1 = getLocalizedDigits(adapter);
    const result2 = getLocalizedDigits(adapter);

    expect(result1).to.equal(result2);
  });
});
