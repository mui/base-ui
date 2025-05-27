'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useDialogClose } from '../../dialog/close/useDialogClose';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';

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
  const { render, className, disabled = false, ...elementProps } = componentProps;
  const { open, setOpen } = useAlertDialogRootContext();
  const { getRootProps } = useDialogClose({ disabled, open, setOpen, rootRef: forwardedRef });

  const state: AlertDialogClose.State = React.useMemo(() => ({ disabled }), [disabled]);

  return useRenderElement('button', componentProps, {
    state,
    props: [elementProps, getRootProps],
  });
});

export namespace AlertDialogClose {
  export interface Props extends BaseUIComponentProps<'button', State> {}

  export interface State {
    /**
     * Whether the button is currently disabled.
     */
    disabled: boolean;
  }
}
