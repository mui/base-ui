'use client';
import * as React from 'react';
import { useButton } from '../internals/use-button/useButton';
import { useRenderElement } from '../internals/useRenderElement';
import type { NativeButtonComponentProps } from '../internals/types';

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
    style,
    ...elementProps
  } = componentProps;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  });

  const state: ButtonState = {
    disabled,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [elementProps, getButtonProps],
  });
}) as unknown as ButtonComponent;

export interface ButtonState {
  /**
   * Whether the button should ignore user interaction.
   */
  disabled: boolean;
}

export type ButtonProps<TNativeButton extends boolean = true> = NativeButtonComponentProps<
  TNativeButton,
  Button.State
> & {
  /**
   * Whether the button should be focusable when disabled.
   * @default false
   */
  focusableWhenDisabled?: boolean | undefined;
};

export namespace Button {
  export type State = ButtonState;
  export type Props<TNativeButton extends boolean = true> = ButtonProps<TNativeButton>;
}

type ButtonComponent = {
  (
    props: Button.Props<true> & { ref?: React.Ref<HTMLButtonElement> | undefined },
  ): React.ReactElement | null;
  (
    props: Button.Props<false> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  (
    props: Button.Props<boolean> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
