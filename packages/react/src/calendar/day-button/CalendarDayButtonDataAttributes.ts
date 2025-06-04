export enum CalendarDayButtonDataAttributes {
  /**
   * Present when the day is selected.
   */
  selected = 'data-selected',
  /**
   * Present when the day is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the day is unavailable.
   */
  unavailable = 'data-unavailable',
  /**
   * Present when the day is the current date.
   */
  current = 'data-current',
  /**
   * Present when the day is the first day of its week.
   */
  startOfWeek = 'data-start-of-week',
  /**
   * Present when the day is the last day of its week.
   */
  endOfWeek = 'data-end-of-week',
  /**
   * Present when the day is outside the month rendered by the day grid wrapping it.
   */
  outsideMonth = 'data-outside-month',
}
