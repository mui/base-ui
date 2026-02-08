'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../utils/types';
import { useToastRootContext } from '../root/ToastRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastAction = React.forwardRef(function ToastAction(
  componentProps: ToastAction.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled, nativeButton = true, ...elementProps } = componentProps;

  const { toast } = useToastRootContext();

  const computedChildren = toast.actionProps?.children ?? elementProps.children;
  const shouldRender = Boolean(computedChildren);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: ToastAction.State = {
    type: toast.type,
  };

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [
      elementProps,
      toast.actionProps,
      getButtonProps,
      {
        children: computedChildren,
      },
    ],
  });

  if (!shouldRender) {
    return null;
  }

  return element;
}) as ToastActionComponent;

export interface ToastActionState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}

export type ToastActionProps<
  TNativeButton extends boolean,
  TElement extends React.ElementType,
> = NativeButtonComponentProps<TNativeButton, TElement, ToastAction.State>;

export namespace ToastAction {
  export type State = ToastActionState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = ToastActionProps<TNativeButton, TElement>;
}

type ToastActionComponent = <
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
>(
  props: ToastAction.Props<TNativeButton, TElement> & {
    ref?: React.Ref<HTMLButtonElement> | undefined;
  },
) => React.ReactElement | null;
