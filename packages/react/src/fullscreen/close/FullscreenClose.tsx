'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';

/**
 * A button that exits the fullscreen container.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export const FullscreenClose = React.forwardRef(function FullscreenClose(
  componentProps: FullscreenClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    disabled = false,
    nativeButton = true,
    render,
    style,
    ...elementProps
  } = componentProps;

  const { handleClose, open } = useFullscreenRootContext();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: FullscreenCloseState = { disabled };

  function handleClick(event: React.MouseEvent) {
    if (open) {
      handleClose(event);
    }
  }

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [{ onClick: handleClick }, elementProps, getButtonProps],
  });
});

export interface FullscreenCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', FullscreenCloseState> {}

export interface FullscreenCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace FullscreenClose {
  export type Props = FullscreenCloseProps;
  export type State = FullscreenCloseState;
}
