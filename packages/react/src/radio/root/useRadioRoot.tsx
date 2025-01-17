'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

export function useRadioRoot(params: useRadioRoot.Parameters) {
  const { disabled, readOnly, value, required } = params;

  const { checkedValue, setCheckedValue, onValueChange, touched, setTouched } =
    useRadioGroupContext();

  const { setDirty, validityData, setTouched: setFieldTouched, setFilled } = useFieldRootContext();

  const checked = checkedValue === value;

  const inputRef = React.useRef<HTMLInputElement>(null);

  const getRootProps: useRadioRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(externalProps, {
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
      }),
    [checked, disabled, readOnly, required, touched, setTouched],
  );

  const getInputProps: useRadioRoot.ReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(externalProps, {
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

          if (disabled || readOnly || value == null) {
            return;
          }

          setFieldTouched(true);
          setDirty(value !== validityData.initialValue);
          setCheckedValue(value);
          setFilled(true);
          onValueChange?.(value, event.nativeEvent);
        },
      }),
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

namespace useRadioRoot {
  export interface Parameters {
    value: unknown;
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
