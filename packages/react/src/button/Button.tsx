'use client';
import * as React from 'react';
import { useButton } from '../use-button/useButton';
import { useRenderElement } from '../utils/useRenderElement';
import type { BaseUIComponentProps } from '../utils/types';

/**
 * A button component that can be used to trigger actions.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Button](https://base-ui.com/react/components/button)
 */
export const Button = React.forwardRef(function Button(
  componentProps: Button.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    pending = false,
    ...elementProps
  } = componentProps;

  const disabled = disabledProp || pending;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: pending,
    native: nativeButton,
  });

  const state: Button.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        'aria-disabled': pending || undefined,
      },
      elementProps,
      getButtonProps,
    ],
  });
});

export namespace Button {
  export interface State {
    /**
     * Whether the button should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    /**
     * Whether the button is currently pending, indicating an ongoing action.
     * When `true`, the button will have a `data-disabled` attribute.
     * @default false
     */
    pending?: boolean;
  }
}
