export enum CalendarRootDataAttributes {
  /**
   * Present when the current value is empty.
   */
  empty = 'data-empty',
  /**
   * Present when the current value is invalid (fails validation).
   */
  invalid = 'data-invalid',
  /**
   * Present when the calendar is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the calendar is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Indicates the direction of the navigation (based on the month navigating to).
   * @type {'previous' | 'next' | 'none'}
   */
  navigationDirection = 'data-navigation-direction',
}
