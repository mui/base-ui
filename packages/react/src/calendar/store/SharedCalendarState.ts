import { TemporalManager } from '../../utils/temporal/types';
import {
  TemporalAdapter,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../types';

export type CalendarNavigationDirection = 'previous' | 'next' | 'none';

export interface SharedCalendarState<TValue extends TemporalSupportedValue = any> {
  /**
   * The value of the calendar, as passed to `props.value` or `props.defaultValue`.
   */
  value: TValue;
  /**
   * The controlled value prop.
   * `undefined` means the value is uncontrolled.
   */
  readonly valueProp: TValue | undefined;
  /**
   * The date that is currently visible in the calendar.
   */
  visibleDate: TemporalSupportedObject;
  /**
   * The controlled visible date prop.
   * `undefined` means the visible date is uncontrolled.
   */
  readonly visibleDateProp: TemporalSupportedObject | undefined;
  /**
   * The direction the calendar is currently navigating in.
   */
  navigationDirection: CalendarNavigationDirection;
  /**
   * The initial date used to generate the reference date if any.
   */
  initialReferenceDateFromValue: TemporalSupportedObject | null;
  /**
   * The timezone as passed to `props.timezone`.
   */
  timezoneProp: TemporalTimezone | undefined;
  /**
   * The reference date as passed to `props.referenceDate`.
   */
  referenceDateProp: TemporalSupportedObject | null;
  /**
   * Whether the calendar is disabled.
   */
  disabled: boolean;
  /**
   * Whether the calendar is readonly.
   */
  readOnly: boolean;
  /**
   * Whether the calendar is forcefully marked as invalid.
   */
  invalidProp: boolean | undefined;
  /**
   * Minimal selectable date.
   */
  minDate: TemporalSupportedObject | undefined;
  /**
   * Maximal selectable date.
   */
  maxDate: TemporalSupportedObject | undefined;
  /**
   * Mark specific dates as unavailable.
   * Those dates will not be selectable but they will still be focusable with the keyboard.
   */
  isDateUnavailable: ((day: TemporalSupportedObject) => boolean) | undefined;
  /**
   * The amount of months to navigate by when pressing `<Calendar.IncrementMonth>`, `<Calendar.DecrementMonth>`.
   */
  monthPageSize: number;
  /**
   * The manager of the calendar (uses `getDateManager` for Calendar and `getDateRangeManager` for RangeCalendar).
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  manager: TemporalManager<TValue, any, any>;
  /**
   * The adapter of the date library.
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  adapter: TemporalAdapter;
}
