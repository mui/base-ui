import { DateTimezone, DateSupportedValue, DateValueType } from '../../models/date';
import { DateValidator } from './useDateValidation';

export interface DateTimezoneProps {
  /**
   * Choose which timezone to use for the value.
   * Example: "default", "system", "UTC", "America/New_York".
   * If you pass values from other timezones to some props, they will be converted to this timezone before being used.
   * @default The timezone of the `value` or `defaultValue` prop is defined, 'default' otherwise.
   */
  timezone?: DateTimezone;
}

export interface DateOnErrorProps<TValue extends DateSupportedValue, TError> {
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
 * Object that contains all the necessary methods and properties to adapt a Picker or a Field for a given value type.
 * You should never create your own manager.
 * Instead, use the hooks exported from '@mui/x-date-pickers/managers' and '@mui/x-date-pickers-pro/managers'.
 *
 * ```tsx
 * import { useDateManager } from '@mui/x-date-pickers/managers';
 * import { useValidation } from '@mui/x-date-pickers/validation';
 *
 * const manager = useDateManager();
 * const { hasValidationError } = useValidation({
 *   validator: manager.validator,
 *   value,
 *   timezone,
 *   props,
 * });
 * ```
 */
export interface DateManager<
  TValue extends DateSupportedValue,
  TError,
  TValidationProps extends {},
  // TFieldInternalProps extends {},
> {
  /**
   * The type of the value (e.g. 'date', 'date-time', 'time').
   */
  valueType: DateValueType;
  /**
   * Checks if a value is valid and returns an error code otherwise.
   * It can be passed to the `useValidation` hook to validate a value:
   *
   * ```tsx
   * import { useDateManager } from '@mui/x-date-pickers/managers';
   * import { useValidation } from '@mui/x-date-pickers/validation';
   *
   * const manager = useDateManager();
   * const { hasValidationError } = useValidation({
   *   validator: manager.validator,
   *   value,
   *   timezone,
   *   props,
   * });
   * ```
   */
  validator: DateValidator<TValue, TError, TValidationProps>;
  // /**
  //  * Object containing basic methods to interact with the value of the Picker or Field.
  //  * This property is not part of the public API and should not be used directly.
  //  */
  // internal_valueManager: PickerValueManager<TValue, TError>;
  // /**
  //  * Object containing all the necessary methods to interact with the value of the Field.
  //  * This property is not part of the public API and should not be used directly.
  //  */
  // internal_fieldValueManager: FieldValueManager<TValue>;
  // /**
  //  * `true` if the field is using the accessible DOM structure.
  //  * `false` if the field is using the non-accessible DOM structure.
  //  * This property is not part of the public API and should not be used directly.
  //  */
  // internal_enableAccessibleFieldDOMStructure: TEnableAccessibleFieldDOMStructure;
  // /**
  //  * Applies the default values to the field internal props.
  //  * This usually includes:
  //  * - a default format to display the value in the field
  //  * - some default validation props that are needed to validate the value (e.g: minDate, maxDate)
  //  * This property is not part of the public API and should not be used directly.
  //  * @param {TFieldInternalProps<TFieldInternalProps>} internalProps The field internal props to apply the defaults to.
  //  * @returns {TFieldInternalPropsWithDefaults} The field internal props with the defaults applied.
  //  */
  // internal_useApplyDefaultValuesToFieldInternalProps: (
  //   internalProps: TFieldInternalProps,
  // ) => UseFieldInternalProps<TValue, TEnableAccessibleFieldDOMStructure, TError> & TValidationProps;
  // /**
  //  * Returns a hook that creates the aria-label to apply on the button that opens the Picker.
  //  * @param {TValue} value The value of the Picker.
  //  * @returns {string} The aria-label to apply on the button that opens the Picker.
  //  */
  // internal_useOpenPickerButtonAriaLabel: (value: TValue) => string;
}
