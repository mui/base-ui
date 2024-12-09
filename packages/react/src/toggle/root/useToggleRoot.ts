'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { NOOP } from '../../utils/noop';
import { GenericHTMLProps } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useButton } from '../../use-button/useButton';

export function useToggleRoot(parameters: useToggleRoot.Parameters): useToggleRoot.ReturnValue {
  const {
    buttonRef: externalRef,
    defaultPressed,
    disabled,
    onPressedChange: onPressedChangeProp = NOOP,
    pressed: pressedProp,
    setGroupValue,
    value,
  } = parameters;

  const [pressed, setPressedState] = useControlled({
    controlled: pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed',
  });

  const onPressedChange = useEventCallback((nextPressed: boolean, event: Event) => {
    setGroupValue(value, nextPressed, event);
    onPressedChangeProp(nextPressed, event);
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: externalRef,
    type: 'button',
  });

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          'aria-pressed': pressed,
          onClick(event: React.MouseEvent) {
            const nextPressed = !pressed;
            setPressedState(nextPressed);
            onPressedChange(nextPressed, event.nativeEvent);
          },
          ref: buttonRef,
        },
        getButtonProps(),
      );
    },
    [getButtonProps, buttonRef, onPressedChange, pressed, setPressedState],
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

export namespace useToggleRoot {
  export interface Parameters {
    buttonRef?: React.Ref<HTMLElement>;
    /**
     * If `true`, the component is pressed.
     */
    pressed?: boolean;
    /**
     * The default pressed state. Use when the component is not controlled.
     * @default false
     */
    defaultPressed?: boolean;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled: boolean;
    /**
     * Callback fired when the pressed state is changed.
     *
     * @param {boolean} pressed The new pressed state.
     * @param {Event} event The event source of the callback.
     */
    onPressedChange: (pressed: boolean, event: Event) => void;
    /**
     * State setter for toggle group value when used in a toggle group
     */
    setGroupValue: (newValue: string, nextPressed: boolean, event: Event) => void;
    /**
     * A unique string that identifies the component when used
     * inside a ToggleGroup.
     */
    value: string;
    // TODO: a prop to indicate `aria-pressed='mixed'` is supported
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps props for the root slot.
     * @returns props that should be spread on the root slot.
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * If `true`, the Toggle is disabled.
     */
    disabled: boolean;
    /**
     * If `true`, the Toggle is pressed.
     */
    pressed: boolean;
  }
}
