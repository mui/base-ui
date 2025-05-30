'use client';
import * as React from 'react';
import { TemporalSupportedValue } from '../../models';
import type { TemporalManager, TemporalOnErrorProps } from './types';

/**
 * Checks if a given value is valid based on the provided validation props.
 */
export function useTemporalValidation<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends {},
>(
  parameters: useTemporalValidation.Parameters<TValue, TError, TValidationProps>,
): useTemporalValidation.ReturnValue<TError> {
  const { validationProps, value, onError, manager } = parameters;

  const previousValidationErrorRef = React.useRef<TError | null>(manager.emptyError);

  const validationError = React.useMemo(
    () => manager.getError(value, validationProps),
    [manager, value, validationProps],
  );

  const invalid = manager.isErrorEmpty(validationError);

  React.useEffect(() => {
    if (onError && !manager.areErrorEquals(validationError, previousValidationErrorRef.current)) {
      onError(validationError, value);
    }

    previousValidationErrorRef.current = validationError;
  }, [manager, onError, validationError, value]);

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
