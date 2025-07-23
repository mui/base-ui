'use client';
import * as React from 'react';
import { useButton } from '../use-button/useButton';
import { useRenderElement } from '../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../utils/types';

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
    loading = false,
    ...elementProps
  } = componentProps;

  const disabled = disabledProp || loading;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: disabledProp ? false : loading,
    native: nativeButton,
  });

  const state: Button.State = React.useMemo(
    () => ({
      disabled,
      loading,
    }),
    [disabled, loading],
  );

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [elementProps, getButtonProps],
  });
});

export namespace Button {
  export interface State {
    /**
     * Whether the button should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the button is currently loading, indicating an ongoing action.
     */
    loading: boolean;
  }

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {
    /**
     * Whether the button is currently loading, indicating an ongoing action.
     * When `true`, the button will disable interactions but remain focusable.
     * @default false
     */
    loading?: boolean;
  }
}
