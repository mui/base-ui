'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldControlValidation } from './useFieldControlValidation';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../useField';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';

export function useFieldControl(params: useFieldControl.Parameters) {
  const { id: idProp, name, value: valueProp, defaultValue, onValueChange, disabled } = params;

  const {
    setControlId,
    labelId,
    setTouched,
    setDirty,
    validityData,
    setFocused,
    setFilled,
    validationMode,
  } = useFieldRootContext();

  const { errors, onClearErrors } = useFormContext();

  const { getValidationProps, getInputValidationProps, commitValidation, inputRef } =
    useFieldControlValidation();

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useEnhancedEffect(() => {
    if (inputRef.current?.value) {
      setFilled(true);
    }
  }, [inputRef, setFilled]);

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'FieldControl',
    state: 'value',
  });

  const setValue = useEventCallback(
    (nextValue: string | number | readonly string[], event: Event) => {
      setValueUnwrapped(nextValue);
      onValueChange?.(nextValue, event);
    },
  );

  useField({
    id,
    commitValidation,
    value,
    getValue: () => inputRef.current?.value,
    controlRef: inputRef,
  });

  const getControlProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'input'>(
        {
          id,
          disabled,
          name,
          ref: inputRef,
          'aria-labelledby': labelId,
          value,
          onChange(event) {
            if (value != null) {
              setValue(event.currentTarget.value, event.nativeEvent);
            }

            setDirty(event.currentTarget.value !== validityData.initialValue);
            setFilled(event.currentTarget.value !== '');

            if (name && {}.hasOwnProperty.call(errors, name)) {
              const nextErrors = { ...errors };
              delete nextErrors[name];
              onClearErrors(nextErrors);
            }
          },
          onFocus() {
            setFocused(true);
          },
          onBlur(event) {
            setTouched(true);
            setFocused(false);

            if (validationMode === 'onBlur') {
              commitValidation(event.currentTarget.value);
            }
          },
          onKeyDown(event) {
            if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
              setTouched(true);
              commitValidation(event.currentTarget.value);
            }
          },
        },
        getValidationProps(getInputValidationProps(externalProps)),
      ),
    [
      getValidationProps,
      getInputValidationProps,
      id,
      disabled,
      name,
      inputRef,
      labelId,
      value,
      setDirty,
      validityData.initialValue,
      setFilled,
      errors,
      setValue,
      onClearErrors,
      setFocused,
      setTouched,
      validationMode,
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

export namespace useFieldControl {
  export interface Parameters {
    id?: string;
    name?: string;
    value?: string | number | readonly string[];
    defaultValue?: string | number | readonly string[];
    onValueChange?: (value: string | number | readonly string[], event: Event) => void;
    disabled?: boolean;
  }
}
