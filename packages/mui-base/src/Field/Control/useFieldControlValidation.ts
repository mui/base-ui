'use client';
import * as React from 'react';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';

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
    validateDebounceMs,
  } = useFieldRootContext();

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

    window.clearTimeout(timeoutRef.current);

    const nextValidityData = {
      state: element.validity,
      error: '',
      errors: [],
      value,
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

    setValidityData({
      ...nextValidityData,
      error: Array.isArray(result) ? result[0] : result ?? element.validationMessage,
      // eslint-disable-next-line no-nested-ternary
      errors: Array.isArray(result) ? result : result ? [result] : [],
    });
  });

  const getValidationProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        ...(messageIds.length && { 'aria-describedby': messageIds.join(' ') }),
        ...(validityData.state.valid === false && { 'aria-invalid': true }),
      }),
    [messageIds, validityData.state.valid],
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

          if (validateDebounceMs) {
            timeoutRef.current = window.setTimeout(() => {
              commitValidation(element.value);
            }, validateDebounceMs);
          } else {
            commitValidation(element.value);
          }
        },
      }),
    [commitValidation, getValidationProps, validateOnChange, validateDebounceMs],
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
