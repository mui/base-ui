/**
 * Lookup in which each date library can register its supported date object type.
 *
 * ```
 * // Example taken from the TemporalAdapterLuxon.ts file.
 * declare module '@base-ui-components/react/models' {
 *   interface TemporalSupportedObjectLookup {
 *     luxon: DateTime;
 *   }
 * }
 * ```
 */
export interface TemporalSupportedObjectLookup {}

/**
 * The valid shape date objects can take in the components and utilities that deal with dates and times.
 */
export type TemporalSupportedObject = keyof TemporalSupportedObjectLookup extends never
  ? any
  : TemporalSupportedObjectLookup[keyof TemporalSupportedObjectLookup];

/**
 * The valid value for the timezone argument in components and utilities that deal with dates and times.
 */
export type TemporalTimezone = 'default' | 'system' | 'UTC' | string;

/**
 * The type that the `value` and `defaultValue` props can receive on non-range date and time components (date, time and date-time).
 */
export type TemporalNonRangeValue = TemporalSupportedObject | null;

/**
 * The type that the `value` and `defaultValue` props can receive on range components (date-range, time-range and date-time-range).
 */
export type TemporalRangeValue = [TemporalSupportedObject | null, TemporalSupportedObject | null];

/**
 * The type that the `value` and `defaultValue` props can receive on all temporal components.
 */
export type TemporalSupportedValue = TemporalNonRangeValue | TemporalRangeValue;

export type TemporalNonNullableRangeValue = [TemporalSupportedObject, TemporalSupportedObject];

export type TemporalNonNullableValue<TValue extends TemporalSupportedValue> =
  TValue extends TemporalRangeValue
    ? TValue extends TemporalNonRangeValue
      ? TemporalSupportedObject | TemporalNonNullableRangeValue
      : TemporalNonNullableRangeValue
    : TemporalSupportedObject;
