'use client';
import * as React from 'react';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalAdapter, TemporalSupportedValue } from '../../models';
import type { TemporalManager, TemporalOnErrorProps } from './types';

/**
 * Checks if a given value is valid based on the provided validation props.
 * @template TValue The value type. It will be the same type as `value` or `null`. It can be in `[start, end]` format in case of range value.
 * @template TError The validation error type. It will be either `string` or a `null`. It can be in `[start, end]` format in case of range value.
 * @param {UseTemporalValidationParameters<TValue, TError, TValidationProps>} parameters The options to configure the hook.
 * @param {TValue} options.value The value to validate.
 * @param {TemporalTimezone} options.timezone The timezone to use for the validation.
 * @param {Validator<TValue, TError, TValidationProps>} options.validator The validator function to use.
 * @param {TValidationProps} options.validationProps The validation props, they differ depending on the component.
 * @param {(error: TError, value: TValue) => void} options.onError Callback fired when the error associated with the current value changes.
 */
export function useTemporalValidation<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends {},
>(
  parameters: useTemporalValidation.Parameters<TValue, TError, TValidationProps>,
): useTemporalValidation.ReturnValue<TError> {
  const {
    validationProps,
    value,
    onError,
    manager: { validator, valueManager },
  } = parameters;

  const adapter = useTemporalAdapter();
  const previousValidationErrorRef = React.useRef<TError | null>(valueManager.defaultErrorState);

  const validationError = validator({ adapter, value, validationProps });
  const invalid = valueManager.hasError(validationError);

  React.useEffect(() => {
    if (onError && !valueManager.isSameError(validationError, previousValidationErrorRef.current)) {
      onError(validationError, value);
    }

    previousValidationErrorRef.current = validationError;
  }, [validator, valueManager, onError, validationError, value]);

  return { validationError, isInvalid: invalid };
}

export namespace useTemporalValidation {
  export interface Parameters<
    TValue extends TemporalSupportedValue,
    TError,
    TValidationProps extends {},
  > extends TemporalOnErrorProps<TValue, TError> {
    /**
     * The value to validate.
     */
    value: TValue;
    /**
     * The manager for the value type.
     */
    manager: TemporalManager<TValue, TError, TValidationProps>;
    /**
     * The validation props, they differ depending on the component.
     * For example, the time components supports `minTime`, `maxTime`, etc.
     */
    validationProps: TValidationProps;
  }

  export interface ReturnValue<TError> {
    /**
     * The validation error associated to the value passed to the `useValidation` hook.
     */
    validationError: TError;
    /**
     * Whether the current value is invalid.
     * For non-range components, it means that the value is invalid.
     * For range components, it means that either start or end value is invalid.
     */
    isInvalid: boolean;
  }
}

export type TemporalValidator<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps,
> = (params: {
  adapter: TemporalAdapter;
  value: TValue;
  validationProps: TValidationProps;
}) => TError;
