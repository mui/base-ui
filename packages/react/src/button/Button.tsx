'use client';
import * as React from 'react';
import { useButton } from '../use-button/useButton';
import { useRenderElement } from '../utils/useRenderElement';
import type { NativeButtonComponentProps } from '../utils/types';

/**
 * A button component that can be used to trigger actions.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Button](https://base-ui.com/react/components/button)
 */
export const Button = React.forwardRef(function Button(
  componentProps: Button.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    disabled = false,
    focusableWhenDisabled = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  });

  const state: Button.State = {
    disabled,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [elementProps, getButtonProps],
  });
}) as ButtonComponent;

export interface ButtonState {
  /**
   * Whether the button should ignore user interaction.
   */
  disabled: boolean;
}

export type ButtonProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
> = NativeButtonComponentProps<TNativeButton, TElement, ButtonState> & {
  /**
   * Whether the button should be focusable when disabled.
   * @default false
   */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * Whether the button should ignore user interaction.
   */
  disabled?: boolean | undefined;
};

export namespace Button {
  export type State = ButtonState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = ButtonProps<TNativeButton, TElement>;
}

type ButtonComponent = <
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
>(
  props: Button.Props<TNativeButton, TElement> & { ref?: React.Ref<HTMLElement> | undefined },
) => React.ReactElement | null;
