export interface DateSupportedShapeLookup {}

/**
 * The valid shape date objects can take in the components and utilities that deal with dates and times.
 */
export type DateSupportedShape = keyof DateSupportedShapeLookup extends never
  ? any
  : DateSupportedShapeLookup[keyof DateSupportedShapeLookup];

/**
 * The valid value for the timezone argument in components and utilities that deal with dates and times.
 */
export type DateTimezone = 'default' | 'system' | 'UTC' | string;

export type DateValueType = 'date' | 'time' | 'date-time';

export type DateSectionContentType = 'digit' | 'digit-with-letter' | 'letter';

export type DateSectionType =
  | 'year'
  | 'month'
  | 'day'
  | 'weekDay'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'meridiem'
  | 'empty';

/**
 * The type that the `value` and `defaultValue` props can receive on non-range date and time components (date, time and date-time).
 */
export type DateNonRangeValue = DateSupportedShape | null;

/**
 * The type that the `value` and `defaultValue` props can receive on range components (date-range, time-range and date-time-range).
 */
export type DateRangeValue = [DateSupportedShape | null, DateSupportedShape | null];

export type DateSupportedValue = DateNonRangeValue | DateRangeValue;
