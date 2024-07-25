import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useRadioGroupRootContext } from '../Root/RadioGroupRootContext';

interface UseRadioGroupItemParameters {
  name?: string;
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
  const { disabled, readOnly, name, required } = params;

  const { checkedItem, setCheckedItem, onValueChange } = useRadioGroupRootContext();

  const checked = checkedItem === name;

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
        onClick(event) {
          if (event.defaultPrevented || disabled || readOnly) {
            return;
          }

          event.preventDefault();

          inputRef.current?.click();
        },
      }),
    [checked, disabled, readOnly, required],
  );

  const getInputProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(externalProps, {
        type: 'radio',
        ref: inputRef,
        tabIndex: -1,
        name,
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

          if (disabled || readOnly || name == null) {
            return;
          }

          setCheckedItem(name);
          onValueChange?.(name, event);
        },
      }),
    [disabled, readOnly, name, checked, setCheckedItem, required, onValueChange],
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
