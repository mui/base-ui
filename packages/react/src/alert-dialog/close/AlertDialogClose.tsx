'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useDialogClose } from '../../dialog/close/useDialogClose';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A button that closes the alert dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogClose = React.forwardRef(function AlertDialogClose(
  props: AlertDialogClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled = false, ...other } = props;
  const { open, setOpen } = useAlertDialogRootContext();
  const { getRootProps } = useDialogClose({ disabled, open, setOpen, rootRef: forwardedRef });

  const state: AlertDialogClose.State = React.useMemo(() => ({ disabled }), [disabled]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    state,
    propGetter: getRootProps,
    extraProps: other,
  });

  return renderElement();
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
