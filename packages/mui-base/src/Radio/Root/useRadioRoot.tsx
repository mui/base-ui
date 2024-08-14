'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useRadioGroupRootContext } from '../../RadioGroup/Root/RadioGroupRootContext';

/**
 *
 * API:
 *
 * - [useRadioRoot API](https://mui.com/base-ui/api/use-radio-root/)
 */
export function useRadioRoot(params: useRadioRoot.Parameters) {
  const { disabled, readOnly, value, required } = params;

  const { checkedItem, setCheckedItem, onValueChange, touched, setTouched } =
    useRadioGroupRootContext();

  const checked = checkedItem === value;

  const inputRef = React.useRef<HTMLInputElement>(null);

  const getRootProps: useRadioRoot.ReturnValue['getRootProps'] = React.useCallback(
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

  const getInputProps: useRadioRoot.ReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(externalProps, {
        type: 'radio' as const,
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
      getRootProps,
      getInputProps,
    }),
    [checked, getRootProps, getInputProps],
  );
}

namespace useRadioRoot {
  export interface Parameters {
    value: string | number;
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
