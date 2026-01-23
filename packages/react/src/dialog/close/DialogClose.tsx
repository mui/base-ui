'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogClose = React.forwardRef(function DialogClose(
  componentProps: DialogClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { store } = useDialogRootContext();
  const open = store.useState('open');

  function handleClick(event: React.MouseEvent) {
    if (open) {
      store.setOpen(false, createChangeEventDetails(REASONS.closePress, event.nativeEvent));
    }
  }

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: DialogClose.State = { disabled };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [{ onClick: handleClick }, elementProps, getButtonProps],
  });
});

export interface DialogCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', DialogClose.State> {}

export interface DialogCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace DialogClose {
  export type Props = DialogCloseProps;
  export type State = DialogCloseState;
}
