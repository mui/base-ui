import { TemporalAdapter, TemporalSupportedObject } from '../../types/temporal';

/**
 * Computes a list of consecutive days starting from the given date.
 * This is a pure function — no React hooks required.
 */
export function getDayList(
  adapter: TemporalAdapter,
  params: { date: TemporalSupportedObject; amount: number },
): TemporalSupportedObject[] {
  const { date, amount } = params;

  if (process.env.NODE_ENV !== 'production') {
    if (amount <= 0) {
      throw new Error(
        `getDayList: The 'amount' parameter must be a positive number, but received ${amount}.`,
      );
    }
  }

  const start = adapter.startOfDay(date);
  const end = adapter.endOfDay(adapter.addDays(start, amount - 1));

  let current = start;
  let currentDayNumber = adapter.getDayOfWeek(current);
  const days: TemporalSupportedObject[] = [];

  while (adapter.isBefore(current, end)) {
    days.push(current);

    const prevDayNumber = currentDayNumber;
    current = adapter.addDays(current, 1);
    currentDayNumber = adapter.getDayOfWeek(current);

    // If there is a TZ change at midnight, adding 1 day may only increase the date by 23 hours to 11pm
    // To fix, bump the date into the next day (add 12 hours) and then revert to the start of the day
    // See https://github.com/moment/moment/issues/4743#issuecomment-811306874 for context.
    if (prevDayNumber === currentDayNumber) {
      current = adapter.startOfDay(adapter.addHours(current, 12));
    }
  }

  return days;
}
