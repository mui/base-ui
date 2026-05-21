'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
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

  const { store } = useFullscreenRootContext();

  const open = store.useState('open');
  const supported = store.useState('supported');

  const { getButtonProps, buttonRef } = useButton({
    disabled: disabledProp,
    native: nativeButton,
  });

  const handleClick = useStableCallback((event: React.MouseEvent) => {
    if (disabledProp || !store.select('open')) {
      return;
    }
    store.setOpen(false, createChangeEventDetails(REASONS.closePress, event.nativeEvent));
  });

  const state: FullscreenCloseState = React.useMemo(
    () => ({
      open,
      disabled: disabledProp,
      supported,
    }),
    [open, disabledProp, supported],
  );

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
