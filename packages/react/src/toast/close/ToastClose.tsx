'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../utils/types';
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

  const { close, expanded } = useToastContext();
  const { toast } = useToastRootContext();

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
        'aria-hidden': !expanded && !hasFocus,
        onClick() {
          close(toast.id);
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
}) as ToastCloseComponent;

export interface ToastCloseState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}

export type ToastCloseProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
> = NativeButtonComponentProps<TNativeButton, TElement, ToastClose.State>;

export namespace ToastClose {
  export type State = ToastCloseState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = ToastCloseProps<TNativeButton, TElement>;
}

type ToastCloseComponent = <
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
>(
  props: ToastClose.Props<TNativeButton, TElement> & {
    ref?: React.Ref<HTMLButtonElement> | undefined;
  },
) => React.ReactElement | null;
