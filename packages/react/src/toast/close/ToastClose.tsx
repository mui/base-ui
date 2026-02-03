'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../internals/types';
import { useToastRootContext } from '../root/ToastRootContext';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useButton } from '../../internals/use-button/useButton';
import { useRenderElement } from '../../internals/useRenderElement';

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
    style,
    disabled,
    nativeButton = true,
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

  const state: ToastCloseState = {
    type: toast.type,
  };

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      {
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
}) as unknown as ToastCloseComponent;

export interface ToastCloseState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}

export type ToastCloseProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, ToastClose.State>;

export namespace ToastClose {
  export type State = ToastCloseState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = ToastCloseProps<TNativeButton, TElement>;
}

type ToastCloseComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: ToastClose.Props<true, TElement> & { ref?: React.Ref<HTMLButtonElement> | undefined },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: ToastClose.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: ToastClose.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
