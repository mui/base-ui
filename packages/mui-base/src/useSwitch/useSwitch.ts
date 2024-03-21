'use client';
import * as React from 'react';
import { useControlled } from '../utils/useControlled';
import { UseSwitchParameters, UseSwitchReturnValue } from './useSwitch.types';
import { useForkRef } from '../utils/useForkRef';
import { visuallyHidden } from '../utils/visuallyHidden';

/**
 * The basic building block for creating custom switches.
 *
 * Demos:
 *
 * - [Switch](https://mui.com/base-ui/react-switch/#hook)
 *
 * API:
 *
 * - [useSwitch API](https://mui.com/base-ui/react-switch/hooks-api/#use-switch)
 */
export function useSwitch(params: UseSwitchParameters): UseSwitchReturnValue {
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

  const getButtonProps: UseSwitchReturnValue['getButtonProps'] = React.useCallback(
    (otherProps = {}) => ({
      type: 'button',
      role: 'switch',
      'aria-checked': checked,
      'aria-disabled': disabled,
      'aria-readonly': readOnly,
      ...otherProps,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        otherProps.onClick?.(event);
        if (event.defaultPrevented || readOnly) {
          return;
        }

        inputRef.current?.click();
      },
    }),
    [checked, disabled, readOnly],
  );

  const getInputProps: UseSwitchReturnValue['getInputProps'] = React.useCallback(
    (otherProps = {}) => ({
      checked,
      disabled,
      name,
      required,
      style: visuallyHidden,
      tabIndex: -1,
      type: 'checkbox',
      'aria-hidden': true,
      ...otherProps,
      ref: handleInputRef,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        // Workaround for https://github.com/facebook/react/issues/9023
        if (event.nativeEvent.defaultPrevented) {
          return;
        }

        setCheckedState(event.target.checked);
        onChange?.(event);
        otherProps.onChange?.(event);
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
