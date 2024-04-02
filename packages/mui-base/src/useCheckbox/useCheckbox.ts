import * as React from 'react';
import { useControlled } from '../utils/useControlled';
import type { UseCheckboxParameters, UseCheckboxReturnValue } from './useCheckbox.types';
import { visuallyHidden } from '../utils/visuallyHidden';
import { useForkRef } from '../utils/useForkRef';
import { mergeReactProps } from '../utils/mergeReactProps';

/**
 * The basic building block for creating custom checkboxes.
 *
 * Demos:
 *
 * - [Checkbox](https://mui.com/base-ui/react-checkbox/#hook)
 *
 * API:
 *
 * - [useCheckbox API](https://mui.com/base-ui/react-checkbox/hooks-api/#use-checkbox)
 */
export function useCheckbox(params: UseCheckboxParameters): UseCheckboxReturnValue {
  const {
    checked: externalChecked,
    inputRef: externalInputRef,
    name,
    onChange,
    defaultChecked = false,
    disabled = false,
    readOnly = false,
    required = false,
    autoFocus = false,
    indeterminate = false,
  } = params;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useForkRef(externalInputRef, inputRef);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const [checked, setCheckedState] = useControlled({
    controlled: externalChecked,
    default: defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  const getButtonProps: UseCheckboxReturnValue['getButtonProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(externalProps, {
        value: 'off',
        type: 'button',
        role: 'checkbox',
        'aria-checked': indeterminate ? 'mixed' : checked,
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        ...externalProps,
        onClick(event) {
          if (event.defaultPrevented || readOnly) {
            return;
          }

          inputRef.current?.click();
        },
      }),
    [checked, disabled, indeterminate, readOnly],
  );

  const getInputProps: UseCheckboxReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(externalProps, {
        checked,
        disabled,
        name,
        required,
        autoFocus,
        ref: mergedInputRef,
        style: visuallyHidden,
        tabIndex: -1,
        type: 'checkbox',
        'aria-hidden': true,
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          setCheckedState(event.target.checked);
          onChange?.(event);
        },
      }),
    [autoFocus, checked, disabled, name, onChange, required, setCheckedState, mergedInputRef],
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
