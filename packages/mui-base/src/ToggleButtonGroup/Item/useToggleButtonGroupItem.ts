'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';
import { useToggleButtonRoot } from '../../ToggleButton/Root/useToggleButtonRoot';

export function useToggleButtonGroupItem(
  parameters: useToggleButtonGroupItem.Parameters,
): useToggleButtonGroupItem.ReturnValue {
  const {
    value,
    groupValue,
    setGroupValue,
    disabled: disabledParam,
    onPressedChange,
    itemRef: externalRef,
  } = parameters;

  const isPressed = groupValue?.indexOf(value) > -1;

  const handlePressedChange = useEventCallback((nextPressed: boolean, event: Event) => {
    setGroupValue(value, nextPressed, event);
    onPressedChange?.(nextPressed, event);
  });

  const {
    pressed,
    disabled,
    getRootProps: getToggleButtonProps,
  } = useToggleButtonRoot({
    pressed: isPressed,
    disabled: disabledParam,
    onPressedChange: handlePressedChange,
    buttonRef: externalRef,
  });

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(externalProps, {}, getToggleButtonProps());
    },
    [getToggleButtonProps],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      disabled,
      pressed,
    }),
    [getRootProps, disabled, pressed],
  );
}

export namespace useToggleButtonGroupItem {
  export interface Parameters
    extends Pick<useToggleButtonRoot.Parameters, 'disabled' | 'onPressedChange'> {
    itemRef?: React.Ref<HTMLElement>;
    /**
     * A unique value that identifies the component when used
     * inside a ToggleButtonGroup
     */
    value: unknown;
    /**
     * The value of the ToggleButtonGroup represented by an array of values
     * of the items that are pressed
     */
    groupValue: unknown[];
    /**
     *
     */
    setGroupValue: (newValue: unknown, nextPressed: boolean, event: Event) => void;
  }

  export interface ReturnValue extends useToggleButtonRoot.ReturnValue {}
}
