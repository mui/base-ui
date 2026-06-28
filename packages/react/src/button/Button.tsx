'use client';
import * as React from 'react';
import { useButton } from '../internals/use-button/useButton';
import { useRenderElement } from '../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../internals/types';
import { runActionInTransition } from '../internals/runActionInTransition';

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
    clickAction,
    ...elementProps
  } = componentProps;

  // Track if we have an action en-route, we don't want double clicks executing the same action.
  const actionPendingRef = React.useRef(false);

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
    props: [
      {
        onClick(event: React.MouseEvent<HTMLElement>) {
          if (!clickAction) {
            return;
          }

          if (actionPendingRef.current) {
            event.preventDefault();
            return;
          }

          event.preventDefault();
          actionPendingRef.current = true;
          runActionInTransition(async () => {
            try {
              await clickAction(event);
            } finally {
              actionPendingRef.current = false;
            }
          });
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
});

export interface ButtonState {
  /**
   * Whether the button should ignore user interaction.
   */
  disabled: boolean;
}

export interface ButtonProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ButtonState> {
  /**
   * Event handler called when the button is activated.
   * The action is run in a React transition when supported.
   */
  clickAction?: ((event: React.MouseEvent<HTMLElement>) => void | PromiseLike<unknown>) | undefined;
  /**
   * Whether the button should be focusable when disabled.
   * @default false
   */
  focusableWhenDisabled?: boolean | undefined;
}

export namespace Button {
  export type State = ButtonState;
  export type Props = ButtonProps;
}
