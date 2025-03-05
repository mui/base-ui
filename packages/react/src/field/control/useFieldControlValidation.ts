'use client';
import * as React from 'react';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../root/FieldRootContext';
import { mergeProps } from '../../utils/mergeProps';
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
  } = useFieldRootContext();

  const { formRef } = useFormContext();

  const timeoutRef = React.useRef(-1);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const commitValidation = useEventCallback(async (value: unknown) => {
    const element = inputRef.current;
    if (!element) {
      return;
    }

    function getState(el: HTMLInputElement) {
      return validityKeys.reduce(
        (acc, key) => {
          acc[key] = el.validity[key];

          if (!el.validity.customError && !markedDirtyRef.current) {
            acc[key] = key === 'valid';
          }

          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );
    }

    window.clearTimeout(timeoutRef.current);

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
      mergeProps(
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

            if (invalid || validationMode !== 'onChange') {
              return;
            }

            const element = event.currentTarget;

            if (element.value === '') {
              // Ignore the debounce time for empty values.
              commitValidation(element.value);
              return;
            }

            window.clearTimeout(timeoutRef.current);

            if (validationDebounceTime) {
              timeoutRef.current = window.setTimeout(() => {
                commitValidation(element.value);
              }, validationDebounceTime);
            } else {
              commitValidation(element.value);
            }
          },
        },
        getValidationProps(externalProps),
      ),
    [getValidationProps, invalid, validationMode, validationDebounceTime, commitValidation],
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
    commitValidation: (value: unknown) => void;
  }
}
