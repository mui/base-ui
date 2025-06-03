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
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const { open, setOpen } = useAlertDialogRootContext();
  const { getRootProps, ref } = useDialogClose({ disabled, open, setOpen, nativeButton });

  const state: AlertDialogClose.State = React.useMemo(() => ({ disabled }), [disabled]);

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [elementProps, getRootProps],
  });
});

export namespace AlertDialogClose {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Determines whether the component is being rendered as a native button.
     * @default true
     */
    nativeButton?: boolean;
  }

  export interface State {
    /**
     * Whether the button is currently disabled.
     */
    disabled: boolean;
  }
}
