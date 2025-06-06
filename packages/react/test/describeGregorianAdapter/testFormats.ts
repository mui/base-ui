import { expect } from 'chai';
import { TemporalAdapterFormats } from '@base-ui-components/react/models';
import { DescribeGregorianAdapterTestSuite } from './describeGregorianAdapter.types';

export const testFormats: DescribeGregorianAdapterTestSuite = ({ adapter }) => {
  const expectFormattedDate = (format: keyof TemporalAdapterFormats, expected: string) => {
    const date = adapter.date('2020-01-01T15:08:09.000Z', 'utc');
    const result = adapter.format(date, format);

    expect(result).to.equal(expected);
  };

  it('should correctly format standalone hardcoded formats', () => {
    // Digit formats with leading zeroes
    expectFormattedDate('yearPadded', '2020');
    expectFormattedDate('monthPadded', '01');
    expectFormattedDate('dayOfMonthPadded', '01');
    expectFormattedDate('hours24hPadded', '15');
    expectFormattedDate('hours12hPadded', '03');
    expectFormattedDate('minutesPadded', '08');
    expectFormattedDate('secondsPadded', '09');

    // Digit formats without leading zeroes
    expectFormattedDate('dayOfMonth', '1');

    // Letter formats
    expectFormattedDate('weekday', 'Wednesday');
    expectFormattedDate('weekday3Letters', 'Wed');
    expectFormattedDate('meridiem', 'PM');
  });
};
