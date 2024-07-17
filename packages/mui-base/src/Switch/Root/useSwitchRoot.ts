'use client';
import * as React from 'react';
import type { UseSwitchRootParameters, UseSwitchRootReturnValue } from './SwitchRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useForkRef } from '../../utils/useForkRef';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

/**
 * The basic building block for creating custom switches.
 *
 * Demos:
 *
 * - [Switch](https://mui.com/base-ui/react-switch/#hook)
 *
 * API:
 *
 * - [useSwitchRoot API](https://mui.com/base-ui/react-switch/hooks-api/#use-switch-root)
 */
export function useSwitchRoot(params: UseSwitchRootParameters): UseSwitchRootReturnValue {
  const {
    id: idProp,
    checked: checkedProp,
    defaultChecked,
    disabled: disabledProp,
    name,
    onCheckedChange: onCheckedChangeProp = () => {},
    readOnly,
    required,
    inputRef: externalInputRef,
  } = params;

  const {
    setControlId,
    messageIds,
    setValidityData,
    disabled: disabledContext,
  } = useFieldRootContext();

  const disabled = disabledContext ?? disabledProp;

  const onCheckedChange = useEventCallback(onCheckedChangeProp);
  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

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
        'aria-describedby': messageIds && messageIds.length ? messageIds.join(' ') : undefined,
        onBlur(event) {
          if (event.defaultPrevented || readOnly) {
            return;
          }

          const element = inputRef.current;
          if (element) {
            setValidityData({
              validityState: element.validity,
              validityMessage: element.validationMessage,
              value: element.checked,
            });
          }
        },
        onClick(event) {
          if (event.defaultPrevented || readOnly) {
            return;
          }

          inputRef.current?.click();
        },
      }),
    [checked, disabled, messageIds, readOnly, setValidityData],
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

          const nextChecked = event.target.checked;

          setCheckedState(nextChecked);
          onCheckedChange?.(nextChecked, event);
        },
      }),
    [checked, disabled, name, required, handleInputRef, onCheckedChange, setCheckedState],
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
