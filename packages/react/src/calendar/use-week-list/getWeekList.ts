import { TemporalSupportedObject, TemporalAdapter } from '../../types/temporal';

/**
 * Computes a list of week-start dates for the given month/date.
 * This is a pure function — no React hooks required.
 */
export function getWeekList(
  adapter: TemporalAdapter,
  params: { date: TemporalSupportedObject; amount: number | 'end-of-month' },
): TemporalSupportedObject[] {
  const { date, amount } = params;

  if (process.env.NODE_ENV !== 'production') {
    if (typeof amount === 'number' && amount <= 0) {
      throw new Error(
        `getWeekList: The 'amount' parameter must be a positive number, but received ${amount}.`,
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
}
