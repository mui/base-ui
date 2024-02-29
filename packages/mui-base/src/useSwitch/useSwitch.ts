'use client';
import * as React from 'react';
import { useControlled } from '../utils/useControlled';
import { UseSwitchParameters, UseSwitchReturnValue } from './useSwitch.types';

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
export function useSwitch(props: UseSwitchParameters): UseSwitchReturnValue {
  const { checked: checkedProp, defaultChecked, disabled, onChange, readOnly, required } = props;

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked',
  });

  const createHandleInputChange =
    (otherProps: React.InputHTMLAttributes<HTMLInputElement>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Workaround for https://github.com/facebook/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }

      setCheckedState(event.target.checked);
      onChange?.(event);
      otherProps.onChange?.(event);
    };

  const createHandleClick =
    (otherProps: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      otherProps.onClick?.(event);
      if (disabled) {
        return;
      }

      setCheckedState((prevChecked) => !prevChecked);
    };

  const getButtonProps: UseSwitchReturnValue['getButtonProps'] = (otherProps = {}) => ({
    role: 'switch',
    'aria-checked': checked,
    'aria-disabled': disabled,
    'aria-readonly': readOnly,
    type: 'button',
    ...otherProps,
    onClick: createHandleClick(otherProps),
  });

  const getInputProps: UseSwitchReturnValue['getInputProps'] = (otherProps = {}) => ({
    checked,
    disabled,
    readOnly,
    required,
    type: 'checkbox',
    'aria-hidden': true,
    tabIndex: -1,
    style: { opacity: 0, width: 0, height: 0, margin: 0, padding: 0, overflow: 'hidden' },
    ...otherProps,
    onChange: createHandleInputChange(otherProps),
  });

  return {
    checked,
    disabled: Boolean(disabled),
    getButtonProps,
    getInputProps,
    readOnly: Boolean(readOnly),
  };
}
