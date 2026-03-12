import { TemporalAdapter } from '../../types/temporal-adapter';
import { TemporalSupportedObject } from '../../types/temporal';
import { getDayList } from '../use-day-list/getDayList';
import { getWeekList } from '../use-week-list/getWeekList';

/**
 * Computes a flat, chronologically ordered array of all days in a month's grid.
 * Composes `getWeekList` and `getDayList` to produce the same result as the rendered grid.
 */
export function computeMonthDayGrid(
  adapter: TemporalAdapter,
  month: TemporalSupportedObject,
  fixedWeekNumber?: number,
): TemporalSupportedObject[] {
  const weeks = getWeekList(adapter, { date: month, amount: fixedWeekNumber ?? 'end-of-month' });
  return weeks.flatMap((week) => getDayList(adapter, { date: week, amount: 7 }));
}
