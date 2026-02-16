import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalSupportedObject } from '../../types/temporal';

export function useCalendarWeekList(): UseWeekListReturnValue {
  const adapter = useTemporalAdapter();

  return React.useCallback(
    ({ date, amount }) => {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof amount === 'number' && amount <= 0) {
          throw new Error(
            `useWeekList: The 'amount' parameter must be a positive number, but received ${amount}.`,
          );
        }
      }

      const start = adapter.startOfWeek(date);
      const end =
        amount === 'end-of-month'
          ? adapter.endOfWeek(adapter.endOfMonth(date))
          : adapter.endOfWeek(adapter.addWeeks(start, amount - 1));

      let current = start;
      let currentWeekNumber = adapter.getWeekNumber(current);
      const weeks: TemporalSupportedObject[] = [];

      while (adapter.isBefore(current, end)) {
        weeks.push(current);

        const prevWeekNumber = currentWeekNumber;
        current = adapter.addWeeks(current, 1);
        currentWeekNumber = adapter.getWeekNumber(current);

        // If there is a TZ change at midnight, adding 1 week may only increase the date by 6 days and 23 hours to 11pm
        // To fix, bump the date into the next day (add 12 hours) and then revert to the start of the day
        // See https://github.com/moment/moment/issues/4743#issuecomment-811306874 for context.
        if (prevWeekNumber === currentWeekNumber) {
          current = adapter.startOfDay(adapter.addHours(current, 12));
        }
      }

      return weeks;
    },
    [adapter],
  );
}

export type UseWeekListReturnValue = (
  parameters: UseWeekListReturnValueParameters,
) => TemporalSupportedObject[];

interface UseWeekListReturnValueParameters {
  /**
   * The date to get the weeks in month for.
   */
  date: TemporalSupportedObject;
  /**
   * The amount of weeks to return.
   * When equal to "end-of-month", the method will return all the weeks until the end of the month.
   * When equal to a number, the method will return that many weeks.
   * Set it to 6 to create a Gregorian calendar where all months have the same number of weeks.
   */
  amount: number | 'end-of-month';
}
