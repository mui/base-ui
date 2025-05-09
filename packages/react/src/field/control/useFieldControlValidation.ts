'use client';
import * as React from 'react';
import { useTimeout } from '../../utils/useTimeout';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../root/FieldRootContext';
import { mergeProps } from '../../merge-props';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import { useFormContext } from '../../form/FormContext';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';
import type { GenericHTMLProps } from '../../utils/types';

const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE) as Array<keyof ValidityState>;

export function useFieldControlValidation() {
  const {
    setValidityData,
    validate,
    messageIds,
    validityData,
    validationMode,
    validationDebounceTime,
    invalid,
    markedDirtyRef,
    controlId,
    state,
    name,
  } = useFieldRootContext();

  const { formRef, clearErrors } = useFormContext();

  const timeout = useTimeout();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const commitValidation = useEventCallback(async (value: unknown, revalidate = false) => {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    if (revalidate && state.valid !== false) {
      return;
    }

    function getState(el: HTMLInputElement) {
      const computedState = validityKeys.reduce(
        (acc, key) => {
          acc[key] = el.validity[key];
          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );

      let hasOnlyValueMissingError = false;

      for (const key of validityKeys) {
        if (key === 'valid') {
          continue;
        }
        if (key === 'valueMissing' && computedState[key]) {
          hasOnlyValueMissingError = true;
        } else if (computedState[key]) {
          return computedState;
        }
      }

      // Only make `valueMissing` mark the field invalid if it's been changed
      // to reduce error noise.
      if (hasOnlyValueMissingError && !markedDirtyRef.current) {
        computedState.valid = true;
        computedState.valueMissing = false;
      }

      return computedState;
    }

    timeout.clear();

    const resultOrPromise = validate(value);
    let result: null | string | string[] = null;
    if (
      typeof resultOrPromise === 'object' &&
      resultOrPromise !== null &&
      'then' in resultOrPromise
    ) {
      result = await resultOrPromise;
    } else {
      result = resultOrPromise;
    }

    let errorMessage = '';
    if (result !== null) {
      errorMessage = Array.isArray(result) ? result.join('\n') : result;
    }
    element.setCustomValidity(errorMessage);

    const nextState = getState(element);

    let validationErrors: string[] = [];
    if (Array.isArray(result)) {
      validationErrors = result;
    } else if (result) {
      validationErrors = [result];
    } else if (element.validationMessage) {
      validationErrors = [element.validationMessage];
    }

    const nextValidityData = {
      value,
      state: nextState,
      error: Array.isArray(result) ? result[0] : (result ?? element.validationMessage),
      errors: validationErrors,
      initialValue: validityData.initialValue,
    };

    if (controlId) {
      const currentFieldData = formRef.current.fields.get(controlId);
      if (currentFieldData) {
        formRef.current.fields.set(controlId, {
          ...currentFieldData,
          ...getCombinedFieldValidityData(nextValidityData, invalid),
        });
      }
    }

    setValidityData(nextValidityData);
  });

  const getValidationProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<any>(
        {
          ...(messageIds.length && { 'aria-describedby': messageIds.join(' ') }),
          ...(state.valid === false && { 'aria-invalid': true }),
        },
        externalProps,
      ),
    [messageIds, state.valid],
  );

  const getInputValidationProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'input'>(
        {
          onChange(event) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented) {
              return;
            }

            clearErrors(name);
            commitValidation(event.currentTarget.value, true);

            if (invalid || validationMode !== 'onChange') {
              return;
            }

            const element = event.currentTarget;

            if (element.value === '') {
              // Ignore the debounce time for empty values.
              commitValidation(element.value);
              return;
            }

            timeout.clear();

            if (validationDebounceTime) {
              timeout.start(validationDebounceTime, () => {
                commitValidation(element.value);
              });
            } else {
              commitValidation(element.value);
            }
          },
        },
        getValidationProps(externalProps),
      ),
    [
      getValidationProps,
      clearErrors,
      name,
      timeout,
      commitValidation,
      invalid,
      validationMode,
      validationDebounceTime,
    ],
  );

  return React.useMemo(
    () => ({
      getValidationProps,
      getInputValidationProps,
      inputRef,
      commitValidation,
    }),
    [getValidationProps, getInputValidationProps, commitValidation],
  );
}

export namespace useFieldControlValidation {
  export interface ReturnValue {
    getValidationProps: (props?: GenericHTMLProps) => GenericHTMLProps;
    getInputValidationProps: (props?: GenericHTMLProps) => GenericHTMLProps;
    inputRef: React.MutableRefObject<any>;
    commitValidation: (value: unknown, revalidate?: boolean) => void;
  }
}
