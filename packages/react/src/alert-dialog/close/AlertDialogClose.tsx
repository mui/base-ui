'use client';
import * as React from 'react';
import { useDialogClose } from '../../dialog/close/useDialogClose';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';

/**
 * A button that closes the alert dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogClose = React.forwardRef(function AlertDialogClose(
  componentProps: AlertDialogClose.Props,
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

  const { getRootProps, ref } = useDialogClose({
    disabled,
    open,
    setOpen: store.setOpen,
    nativeButton,
  });

  const state: AlertDialogClose.State = React.useMemo(() => ({ disabled }), [disabled]);

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [elementProps, getRootProps],
  });
});

export interface AlertDialogCloseProps
  extends NativeButtonProps,
    BaseUIComponentProps<'button', AlertDialogClose.State> {}

export interface AlertDialogCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace AlertDialogClose {
  export type Props = AlertDialogCloseProps;
  export type State = AlertDialogCloseState;
}
