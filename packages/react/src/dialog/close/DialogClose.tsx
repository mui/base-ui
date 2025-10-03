'use client';
import * as React from 'react';
import { useDialogClose } from './useDialogClose';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';

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

  const { getRootProps, ref } = useDialogClose({
    disabled,
    open,
    setOpen: store.setOpen,
    nativeButton,
  });

  const state: DialogClose.State = React.useMemo(() => ({ disabled }), [disabled]);

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [elementProps, getRootProps],
  });
});

export namespace DialogClose {
  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {}

  export interface State {
    /**
     * Whether the button is currently disabled.
     */
    disabled: boolean;
  }
}
