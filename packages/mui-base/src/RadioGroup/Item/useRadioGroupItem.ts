import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useRadioGroupRootContext } from '../Root/RadioGroupRootContext';

interface UseRadioGroupItemParameters {
  value: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 *
 * API:
 *
 * - [useRadioGroupItem API](https://mui.com/base-ui/api/use-radio-group-item/)
 */
export function useRadioGroupItem(params: UseRadioGroupItemParameters) {
  const { disabled, value, name, required } = params;

  const { checkedItem, setCheckedItem } = useRadioGroupRootContext();

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
        onClick(event) {
          if (event.defaultPrevented || disabled) {
            return;
          }

          event.preventDefault();

          inputRef.current?.click();
        },
      }),
    [checked, disabled, required],
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
        style: visuallyHidden,
        'aria-hidden': true,
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented || disabled) {
            return;
          }

          setCheckedItem(value);
        },
      }),
    [disabled, name, checked, setCheckedItem, value, required],
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
