'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { NOOP } from '../../utils/noop';
import { GenericHTMLProps } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useButton } from '../../use-button/useButton';

export function useToggleButtonRoot(
  parameters: useToggleButtonRoot.Parameters,
): useToggleButtonRoot.ReturnValue {
  const {
    pressed: pressedProp,
    onPressedChange: onPressedChangeProp = NOOP,
    defaultPressed = false,
    disabled = false,
    buttonRef: externalRef,
  } = parameters;

  const [pressed, setPressedState] = useControlled({
    controlled: pressedProp,
    default: defaultPressed,
    name: 'ToggleButton',
    state: 'pressed',
  });

  const onPressedChange = useEventCallback(onPressedChangeProp);

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
            onPressedChange?.(nextPressed, event.nativeEvent);
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

export namespace useToggleButtonRoot {
  export interface Parameters {
    buttonRef?: React.Ref<HTMLElement>;
    /**
     * If `true`, the component is pressed.
     *
     * @default undefined
     */
    pressed?: boolean;
    /**
     * The default pressed state. Use when the component is not controlled.
     *
     * @default false
     */
    defaultPressed?: boolean;
    /**
     * If `true`, the component is disabled.
     *
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
    // TODO: a prop to indicate `aria-pressed='mixed'` is supported
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps props for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * If `true`, the ToggleButton is disabled.
     */
    disabled: boolean;
    /**
     * If `true`, the ToggleButton is pressed.
     */
    pressed: boolean;
  }
}
