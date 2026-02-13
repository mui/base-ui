'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useToastRootContext } from '../root/ToastRootContext';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import { getCloseButtonStyle } from '../../utils/closePart';

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
  const {
    render,
    className,
    disabled,
    nativeButton = true,
    visuallyHidden = false,
    ...elementProps
  } = componentProps;

  const store = useToastProviderContext();
  const { toast } = useToastRootContext();
  const expanded = store.useState('expanded');

  const [hasFocus, setHasFocus] = React.useState(false);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: ToastClose.State = {
    type: toast.type,
  };

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      {
        style: getCloseButtonStyle(visuallyHidden),
        'aria-hidden': !expanded && !hasFocus,
        onClick() {
          store.closeToast(toast.id);
        },
        onFocus() {
          setHasFocus(true);
        },
        onBlur() {
          setHasFocus(false);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export interface ToastCloseState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}

export interface ToastCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ToastClose.State> {
  /**
   * Whether the close button should be visually hidden.
   * @default false
   */
  visuallyHidden?: boolean | undefined;
}

export namespace ToastClose {
  export type State = ToastCloseState;
  export type Props = ToastCloseProps;
}
