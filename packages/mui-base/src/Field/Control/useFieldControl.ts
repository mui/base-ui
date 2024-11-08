'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect.js';
import { useId } from '../../utils/useId.js';
import { useFieldRootContext } from '../Root/FieldRootContext.js';
import { useFieldControlValidation } from './useFieldControlValidation.js';
import { useFormRootContext } from '../../Form/Root/FormRootContext.js';
import { useField } from '../useField.js';
import { useControlled } from '../../utils/useControlled.js';
import { useEventCallback } from '../../utils/useEventCallback.js';

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
