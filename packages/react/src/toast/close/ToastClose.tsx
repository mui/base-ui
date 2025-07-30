'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useToastRootContext } from '../root/ToastRootContext';
import { useToastContext } from '../provider/ToastProviderContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastClose = React.forwardRef(function ToastClose(
  componentProps: ToastClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled, nativeButton = true, ...elementProps } = componentProps;

  const { close, focused } = useToastContext();
  const { toast } = useToastRootContext();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: ToastClose.State = React.useMemo(
    () => ({
      type: toast.type,
    }),
    [toast.type],
  );

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      {
        'aria-hidden': !focused || undefined,
        onClick() {
          close(toast.id);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace ToastClose {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {}
}
