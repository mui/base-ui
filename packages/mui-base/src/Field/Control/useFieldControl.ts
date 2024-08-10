'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldControlValidation } from './useFieldControlValidation';
import { useFormRootContext } from '../../Form/Root/FormRootContext';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';

interface UseFieldControlParameters {
  id?: string;
  name?: string;
  value: string | number | readonly string[];
}

/**
 *
 * API:
 *
 * - [useFieldControl API](https://mui.com/base-ui/api/use-field-control/)
 */
export function useFieldControl(params: UseFieldControlParameters) {
  const { id: idProp, name, value } = params;

  const {
    setControlId,
    labelId,
    disabled,
    setTouched,
    setDirty,
    setMarkedDirty,
    validityData,
    setValidityData,
    invalid,
  } = useFieldRootContext();

  const { formRef, errors, onClearErrors } = useFormRootContext();

  const { getValidationProps, getInputValidationProps, commitValidation, inputRef } =
    useFieldControlValidation();

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && value !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: value }));
    }
  }, [setValidityData, validityData.initialValue, value]);

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useEnhancedEffect(() => {
    if (id) {
      formRef.current.fields.set(id, {
        controlRef: inputRef,
        validityData: getCombinedFieldValidityData(validityData, invalid),
        validate() {
          if (!inputRef.current) {
            return;
          }
          ReactDOM.flushSync(() => setMarkedDirty(true));
          commitValidation(inputRef.current.value);
        },
      });
    }
  }, [commitValidation, formRef, id, inputRef, setMarkedDirty, validityData, invalid]);

  const getControlProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(getValidationProps(getInputValidationProps(externalProps)), {
        id,
        disabled,
        name,
        ref: inputRef,
        'aria-labelledby': labelId,
        onChange(event) {
          setDirty(event.currentTarget.value !== validityData.initialValue);
          if (name && {}.hasOwnProperty.call(errors, name)) {
            const nextErrors = { ...errors };
            delete nextErrors[name];
            onClearErrors(nextErrors);
          }
        },
        onBlur(event) {
          setTouched(true);
          commitValidation(event.currentTarget.value);
        },
        onKeyDown(event) {
          if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
            setTouched(true);
            commitValidation(event.currentTarget.value);
          }
        },
      }),
    [
      getValidationProps,
      getInputValidationProps,
      id,
      disabled,
      name,
      inputRef,
      labelId,
      setDirty,
      validityData.initialValue,
      errors,
      onClearErrors,
      setTouched,
      commitValidation,
    ],
  );

  return React.useMemo(
    () => ({
      getControlProps,
    }),
    [getControlProps],
  );
}
