'use client';
import * as React from 'react';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';

const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE) as Array<keyof ValidityState>;

/**
 *
 * API:
 *
 * - [useFieldControlValidation API](https://mui.com/base-ui/api/use-field-control-validation/)
 */
export function useFieldControlValidation() {
  const {
    setValidityData,
    validate,
    messageIds,
    validityData,
    validateOnChange,
    validateDebounceTime,
    invalid,
  } = useFieldRootContext();

  const valid = !invalid && validityData.state.valid;

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
      const val = validityKeys.reduce(
        (acc, key) => {
          acc[key] = el.validity[key];
          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );
      val.valid = invalid ? false : el.validity.valid;
      return val;
    }

    window.clearTimeout(timeoutRef.current);

    const nextValidityData = {
      state: getState(element),
      error: '',
      errors: [],
      value,
      initialValue: validityData.initialValue,
    };

    setValidityData(nextValidityData);
    element.setCustomValidity('');

    const resultOrPromise = validate(nextValidityData.value);
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

    let errors: string[] = [];
    if (Array.isArray(result)) {
      errors = result;
    } else if (result) {
      errors = [result];
    } else if (element.validationMessage) {
      errors = [element.validationMessage];
    }

    setValidityData({
      ...nextValidityData,
      state: getState(element),
      error: Array.isArray(result) ? result[0] : result ?? element.validationMessage,
      errors,
    });
  });

  const getValidationProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        ...(messageIds.length && { 'aria-describedby': messageIds.join(' ') }),
        ...(valid === false && { 'aria-invalid': true }),
      }),
    [messageIds, valid],
  );

  const getInputValidationProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(getValidationProps(externalProps), {
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented || !validateOnChange) {
            return;
          }

          const element = event.currentTarget;

          window.clearTimeout(timeoutRef.current);

          if (validateDebounceTime) {
            timeoutRef.current = window.setTimeout(() => {
              commitValidation(element.value);
            }, validateDebounceTime);
          } else {
            commitValidation(element.value);
          }
        },
      }),
    [commitValidation, getValidationProps, validateOnChange, validateDebounceTime],
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
