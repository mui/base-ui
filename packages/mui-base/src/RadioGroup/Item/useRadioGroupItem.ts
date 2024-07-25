'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useRadioGroupRootContext } from '../Root/RadioGroupRootContext';

interface UseRadioGroupItemParameters {
  value: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

/**
 *
 * API:
 *
 * - [useRadioGroupItem API](https://mui.com/base-ui/api/use-radio-group-item/)
 */
export function useRadioGroupItem(params: UseRadioGroupItemParameters) {
  const { disabled, readOnly, value, required } = params;

  const { checkedItem, setCheckedItem, onValueChange, touched, setTouched } =
    useRadioGroupRootContext();

  const checked = checkedItem === value;

  const inputRef = React.useRef<HTMLInputElement>(null);

  const getItemProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(externalProps, {
        role: 'radio',
        type: 'button',
        'aria-checked': checked,
        'aria-required': required,
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
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

  const getInputProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(externalProps, {
        type: 'radio',
        ref: inputRef,
        tabIndex: -1,
        disabled,
        checked,
        required,
        readOnly,
        style: visuallyHidden,
        'aria-hidden': true,
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          if (disabled || readOnly || value == null) {
            return;
          }

          setCheckedItem(value);
          onValueChange?.(value, event);
        },
      }),
    [disabled, readOnly, value, checked, setCheckedItem, required, onValueChange],
  );

  return React.useMemo(
    () => ({
      checked,
      getItemProps,
      getInputProps,
    }),
    [checked, getItemProps, getInputProps],
  );
}
