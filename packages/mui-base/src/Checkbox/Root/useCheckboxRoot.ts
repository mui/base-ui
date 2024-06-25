import * as React from 'react';
import type { UseCheckboxRootParameters, UseCheckboxRootReturnValue } from './CheckboxRoot.types';
import { useControlled } from '../../utils/useControlled';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 * The basic building block for creating custom checkboxes.
 *
 * Demos:
 *
 * - [Checkbox](https://mui.com/base-ui/react-checkbox/#hook)
 *
 * API:
 *
 * - [useCheckboxRoot API](https://mui.com/base-ui/react-checkbox/hooks-api/#use-checkbox-root)
 */
export function useCheckboxRoot(params: UseCheckboxRootParameters): UseCheckboxRootReturnValue {
  const {
    checked: externalChecked,
    inputRef: externalInputRef,
    name,
    onCheckedChange: onCheckedChangeProp = () => {},
    defaultChecked = false,
    disabled = false,
    readOnly = false,
    required = false,
    autoFocus = false,
    indeterminate = false,
  } = params;

  const onCheckedChange = useEventCallback(onCheckedChangeProp);

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

  const getButtonProps: UseCheckboxRootReturnValue['getButtonProps'] = React.useCallback(
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

  const getInputProps: UseCheckboxRootReturnValue['getInputProps'] = React.useCallback(
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

          const nextChecked = event.target.checked;

          setCheckedState(nextChecked);
          onCheckedChange?.(nextChecked, event);
        },
      }),
    [
      autoFocus,
      checked,
      disabled,
      name,
      onCheckedChange,
      required,
      setCheckedState,
      mergedInputRef,
    ],
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
