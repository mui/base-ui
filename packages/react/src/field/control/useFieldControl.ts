'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldControlValidation } from './useFieldControlValidation';
import { useFormRootContext } from '../../form/root/FormRootContext';
import { useField } from '../useField';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';

export function useFieldControl(params: useFieldControl.Parameters) {
  const { id: idProp, name, value: valueProp, defaultValue, onValueChange, disabled } = params;

  const { setControlId, labelId, setTouched, setDirty, validityData } = useFieldRootContext();

  const { errors, onClearErrors } = useFormRootContext();

  const { getValidationProps, getInputValidationProps, commitValidation, inputRef } =
    useFieldControlValidation();

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

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
      mergeReactProps<'input'>(getValidationProps(getInputValidationProps(externalProps)), {
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
      value,
      setValue,
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
