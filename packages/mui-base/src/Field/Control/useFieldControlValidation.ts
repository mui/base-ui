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
    validationDebounceMs,
  } = useFieldRootContext();

  const timeoutRef = React.useRef(-1);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const performValidation = useEventCallback(async (element: HTMLInputElement, value: unknown) => {
    const nextValidityData = {
      state: element.validity,
      message: '',
      value,
    };

    setValidityData(nextValidityData);
    element.setCustomValidity('');

    const resultOrPromise = validate(nextValidityData.value);
    let result;
    if (
      typeof resultOrPromise === 'object' &&
      resultOrPromise !== null &&
      'then' in resultOrPromise
    ) {
      result = await resultOrPromise;
    } else {
      result = resultOrPromise;
    }

    element.setCustomValidity(result !== null ? result : '');

    setValidityData({
      ...nextValidityData,
      message: result ?? element.validationMessage,
    });
  });

  const commitValidation = useEventCallback((value: unknown) => {
    const element = inputRef.current;
    if (!element) {
      return;
    }
    window.clearTimeout(timeoutRef.current);
    performValidation(element, value);
  });

  const getValidationProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        ...(messageIds.length && { 'aria-describedby': messageIds.join(' ') }),
        ...(!validityData.state.valid && { 'aria-invalid': true }),
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
          timeoutRef.current = window.setTimeout(() => {
            performValidation(element, element.value);
          }, validationDebounceMs);
        },
      }),
    [getValidationProps, performValidation, validateOnChange, validationDebounceMs],
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
