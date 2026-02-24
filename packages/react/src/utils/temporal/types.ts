import {
  TemporalTimezone,
  TemporalSupportedValue,
  TemporalSupportedObject,
} from '../../types/temporal';

export interface TemporalTimezoneProps {
  /**
   * Choose which timezone to use for the value.
   * Example: "default", "system", "UTC", "America/New_York".
   * If you pass values from other timezones to some props, they will be converted to this timezone before being used.
   * @default 'The timezone of the "value" or "defaultValue" prop if defined, "default" otherwise.'
   */
  timezone?: TemporalTimezone | undefined;
}

export interface TemporalOnErrorProps<TValue extends TemporalSupportedValue, TError> {
  /**
   * Callback fired when the error associated with the current value changes.
   * When a validation error is detected, the `error` parameter contains a non-null value.
   * This can be used to render an appropriate form error.
   * @template TError The validation error type. It will be either `string` or a `null`. It can be in `[start, end]` format in case of range value.
   * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
   * @param {TError} error The reason why the current value is not valid.
   * @param {TValue} value The value associated with the error.
   */
  onError?: ((error: TError, value: TValue) => void) | undefined;
}

/**
 * Object that contains all the necessary methods and properties to adapt a temporal component or utilities for a given value type.
 */
export interface TemporalManager<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends {},
> {
  /**
   * Value to set when emptying the component.
   */
  emptyValue: TValue;
  /**
   * Error when the value is valid.
   * It is used to initialize the error state.
   */
  emptyValidationError: TError;
  /**
   * The type of dates handled by the manager (e.g. 'date', 'date-time', 'time').
   */
  dateType: TemporalDateType;
  /**
   * Checks whether two values are equal.
   */
  areValuesEqual: (valueA: TValue, valueB: TValue) => boolean;
  /**
   * Returns the error associated with a value for the current set of validation props.
   */
  getValidationError: (value: TValue, validationProps: TValidationProps) => TError;
  /**
   * Checks whether two validation errors are equal.
   */
  areValidationErrorEquals: (errorA: TError, errorB: TError | null) => boolean;
  /**
   * Checks whether the current validation error is empty.
   */
  isValidationErrorEmpty: (error: TError) => boolean;
  /**
   * Returns the timezone of the date inside a value.
   * When used on a range component, throw an error if both values don't have the same timezone.
   */
  getTimezone: (value: TValue) => string | null;
  /**
   * Changes the timezone of the dates inside a value.
   */
  setTimezone: (value: TValue, timezone: TemporalTimezone) => TValue;
  /**
   * Returns the list of dates contained in the value.
   */
  getDatesFromValue: (value: TValue) => TemporalSupportedObject[];
}

export type TemporalDateType = 'date' | 'time' | 'date-time';
