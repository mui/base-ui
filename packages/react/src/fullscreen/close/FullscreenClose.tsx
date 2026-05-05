'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';
import type { FullscreenRootState } from '../root/FullscreenRoot';
import { fullscreenStateMapping } from '../root/stateAttributesMapping';

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
    disabled: disabledProp = false,
    nativeButton = true,
    render,
    style,
    ...elementProps
  } = componentProps;

  const { handleClose, open, state: rootState } = useFullscreenRootContext();

  const { getButtonProps, buttonRef } = useButton({
    disabled: disabledProp,
    native: nativeButton,
  });

  const state: FullscreenCloseState = React.useMemo(
    () => ({
      ...rootState,
      disabled: disabledProp,
    }),
    [rootState, disabledProp],
  );

  function handleClick(event: React.MouseEvent) {
    if (open) {
      handleClose(event);
    }
  }

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [{ onClick: handleClick }, elementProps, getButtonProps],
    stateAttributesMapping: fullscreenStateMapping,
  });
});

export interface FullscreenCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', FullscreenCloseState> {}

export interface FullscreenCloseState extends FullscreenRootState {}

export namespace FullscreenClose {
  export type Props = FullscreenCloseProps;
  export type State = FullscreenCloseState;
}
