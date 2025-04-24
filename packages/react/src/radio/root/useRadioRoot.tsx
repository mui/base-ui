'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

export function useRadioRoot(params: useRadioRoot.Parameters) {
  const { disabled, readOnly, value, required } = params;

  const {
    checkedValue,
    setCheckedValue,
    onValueChange,
    touched,
    setTouched,
    fieldControlValidation,
  } = useRadioGroupContext();

  const {
    setDirty,
    validityData,
    setTouched: setFieldTouched,
    setFilled,
    validationMode,
  } = useFieldRootContext();

  const checked = checkedValue === value;

  const inputRef = React.useRef<HTMLInputElement>(null);

  useEnhancedEffect(() => {
    if (inputRef.current?.checked) {
      setFilled(true);
    }
  }, [setFilled]);

  const getRootProps: useRadioRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps) =>
      mergeProps<'button'>(
        {
          role: 'radio',
          type: 'button',
          'aria-checked': checked,
          'aria-required': required || undefined,
          'aria-disabled': disabled || undefined,
          'aria-readonly': readOnly || undefined,
          disabled,
          onKeyDown(event) {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          },
          onClick(event) {
            if (event.defaultPrevented || disabled || readOnly) {
              return;
            }

            event.preventDefault();

            inputRef.current?.click();
          },
          onFocus(event) {
            if (event.defaultPrevented || disabled || readOnly || !touched) {
              return;
            }

            inputRef.current?.click();

            setTouched(false);
          },
        },
        fieldControlValidation
          ? fieldControlValidation.getValidationProps(externalProps)
          : externalProps,
      ),
    [fieldControlValidation, checked, required, disabled, readOnly, touched, setTouched],
  );

  const getInputProps: useRadioRoot.ReturnValue['getInputProps'] = React.useCallback(
    (externalProps) =>
      mergeProps<'input'>(
        {
          type: 'radio',
          ref: inputRef,
          tabIndex: -1,
          style: visuallyHidden,
          'aria-hidden': true,
          disabled,
          checked,
          required,
          readOnly,
          onChange(event) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented) {
              return;
            }

            if (disabled || readOnly || value === undefined) {
              return;
            }

            setFieldTouched(true);
            setDirty(value !== validityData.initialValue);
            setCheckedValue(value);
            setFilled(true);
            onValueChange?.(value, event.nativeEvent);

            if (validationMode === 'onChange') {
              fieldControlValidation?.commitValidation(value);
            }
          },
        },
        externalProps,
      ),
    [
      disabled,
      checked,
      required,
      readOnly,
      value,
      setFieldTouched,
      setDirty,
      validityData.initialValue,
      setCheckedValue,
      setFilled,
      onValueChange,
      validationMode,
      fieldControlValidation,
    ],
  );

  return React.useMemo(
    () => ({
      checked,
      getRootProps,
      getInputProps,
    }),
    [checked, getRootProps, getInputProps],
  );
}

export namespace useRadioRoot {
  export interface Parameters {
    value: any;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
  }

  export interface ReturnValue {
    checked: boolean;
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
    getInputProps: (
      externalProps?: React.ComponentPropsWithRef<'input'>,
    ) => React.ComponentPropsWithRef<'input'>;
  }
}
