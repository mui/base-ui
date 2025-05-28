import { TemporalAdapter } from '@base-ui-components/react/models';
import {
  TemporalTimezone,
  TemporalSupportedValue,
  TemporalValueType,
  TemporalSupportedObject,
  TemporalNonNullableValue,
} from '../../models/temporal';
import { TemporalValidator } from './useTemporalValidation';
import { getDefaultReferenceDate } from './getDefaultReferenceDate';

export interface TemporalTimezoneProps {
  /**
   * Choose which timezone to use for the value.
   * Example: "default", "system", "UTC", "America/New_York".
   * If you pass values from other timezones to some props, they will be converted to this timezone before being used.
   * @default The timezone of the `value` or `defaultValue` prop is defined, 'default' otherwise.
   */
  timezone?: TemporalTimezone;
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
  onError?: (error: TError, value: TValue) => void;
}

/**
 * Object that contains all the necessary methods and properties to adapt a temporal component or utilities for a given value type.
 */
export interface TemporalManager<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends {},
  // TFieldInternalProps extends {},
> {
  /**
   * The type of the value (e.g. 'date', 'date-time', 'time').
   */
  valueType: TemporalValueType;
  /**
   * Checks if a value is valid and returns an error code otherwise.
   */
  validator: TemporalValidator<TValue, TError, TValidationProps>;
  /**
   * Object containing basic methods to interact with the value of a temporal component.
   * This property is not part of the public API and should not be used directly.
   */
  internal_valueManager: TemporalValueManager<TValue, TError>;
}

export interface TemporalValueManager<TValue extends TemporalSupportedValue, TError> {
  /**
   * Determines if two values are equal.
   * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
   * @param {TemporalAdapter} adapter The date library adapter.
   * @param {TValue} valueLeft The first value to compare.
   * @param {TValue} valueRight The second value to compare.
   * @returns {boolean} A boolean indicating if the two values are equal.
   */
  areValuesEqual: (adapter: TemporalAdapter, valueLeft: TValue, valueRight: TValue) => boolean;
  /**
   * Value to set when clicking the "Clear" button.
   */
  emptyValue: TValue;
  /**
   * Method returning the value to set when clicking the "Today" button.
   * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
   * @param {TemporalAdapter} adapter The date library adapter.
   * @param {TemporalTimezone} timezone The current timezone.
   * @param {TemporalValueType} valueType The type of the value being edited.
   * @returns {TValue} The value to set when clicking the "Today" button.
   */
  getTodayValue: (
    adapter: TemporalAdapter,
    timezone: TemporalTimezone,
    valueType: TemporalValueType,
  ) => TValue;
  /**
   * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
   * Method returning the reference value to use when mounting the component.
   * @param {object} params The params of the method.
   * @param {TemporalSupportedObject | undefined} params.referenceDate The referenceDate provided by the user.
   * @param {TValue} params.value The value provided by the user.
   * @param {getDefaultReferenceDate.Props} params.props The validation props needed to compute the reference value.
   * @param {TemporalAdapter} params.adapter The date library adapter.
   * @param {number} params.granularity The granularity of the selection possible on this component.
   * @param {TemporalTimezone} params.timezone The current timezone.
   * @param {() => TemporalSupportedObject} params.getTodayDate The reference date to use if no reference date is passed to the component.
   * @returns {TValue} The reference value to use for non-provided dates.
   */
  getInitialReferenceValue: (params: {
    referenceDate: TemporalSupportedObject | undefined;
    value: TValue;
    props: getDefaultReferenceDate.Props;
    adapter: TemporalAdapter;
    granularity: number;
    timezone: TemporalTimezone;
    getTodayDate?: () => TemporalSupportedObject;
  }) => TemporalNonNullableValue<TValue>;
  /**
   * Method parsing the input value to replace all invalid dates by `null`.
   * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
   * @param {TemporalAdapter} adapter The date library adapter.
   * @param {TValue} value The value to parse.
   * @returns {TValue} The value without invalid date.
   */
  cleanValue: (adapter: TemporalAdapter, value: TValue) => TValue;
  /**
   * Generates the new value, given the previous value and the new proposed value.
   * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
   * @param {TemporalAdapter} adapter The date library adapter.
   * @param {TValue} lastValidDateValue The last valid value.
   * @param {TValue} value The proposed value.
   * @returns {TValue} The new value.
   */
  valueReducer?: (adapter: TemporalAdapter, lastValidDateValue: TValue, value: TValue) => TValue;
  /**
   * Compare two errors to know if they are equal.
   * @template TError
   * @param {TError} error The new error
   * @param {TError | null} prevError The previous error
   * @returns {boolean} `true` if the new error is different from the previous one.
   */
  isSameError: (error: TError, prevError: TError | null) => boolean;
  /**
   * Checks if the current error is empty or not.
   * @template TError
   * @param {TError} error The current error.
   * @returns {boolean} `true` if the current error is not empty.
   */
  hasError: (error: TError) => boolean;
  /**
   * The value identifying no error, used to initialize the error state.
   */
  defaultErrorState: TError;
  /**
     * Return the timezone of the date inside a value.
     * When used on a range component, throw an error if both values don't have the same timezone.
     * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
     @param {TemporalAdapter} adapter The date library adapter.
     @param {TValue} value The current value.
     @returns {string | null} The timezone of the current value.
     */
  getTimezone: (adapter: TemporalAdapter, value: TValue) => string | null;
  /**
     * Change the timezone of the dates inside a value.
     * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
     @param {TemporalAdapter} adapter The date library adapter.
     @param {TemporalTimezone} timezone The current timezone.
     @param {TValue} value The value to convert.
     @returns {TValue} The value with the new dates in the new timezone.
     */
  setTimezone: (adapter: TemporalAdapter, timezone: TemporalTimezone, value: TValue) => TValue;
}
