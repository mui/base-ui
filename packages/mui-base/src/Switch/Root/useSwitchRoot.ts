'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import type { UseSwitchRootParameters, UseSwitchRootReturnValue } from './SwitchRoot.types';
import { useForkRef } from '../../utils/useForkRef';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 * The basic building block for creating custom switches.
 *
 * API:
 *
 * - [useSwitchRoot API](https://mui.com/base-ui/api/use-switch-root/)
 */
export function useSwitchRoot(params: UseSwitchRootParameters): UseSwitchRootReturnValue {
  const {
    checked: checkedProp,
    defaultChecked,
    disabled,
    name,
    onChange,
    readOnly,
    required,
    inputRef: externalInputRef,
  } = params;

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const handleInputRef = useForkRef(inputRef, externalInputRef);

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked',
  });

  const getButtonProps = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'button'>(otherProps, {
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        'aria-disabled': disabled,
        'aria-readonly': readOnly,
        onClick(event) {
          if (event.defaultPrevented || readOnly) {
            return;
          }

          inputRef.current?.click();
        },
      }),
    [checked, disabled, readOnly],
  );

  const getInputProps = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'input'>(otherProps, {
        checked,
        disabled,
        name,
        required,
        style: visuallyHidden,
        tabIndex: -1,
        type: 'checkbox',
        'aria-hidden': true,
        ref: handleInputRef,
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          setCheckedState(event.target.checked);
          onChange?.(event);
        },
      }),
    [checked, disabled, name, required, handleInputRef, onChange, setCheckedState],
  );

  return React.useMemo(
    () => ({
      checked,
      getButtonProps,
      getInputProps,
    }),
    [checked, getButtonProps, getInputProps],
  );
}
