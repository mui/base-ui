'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
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

  const state: ToastAction.State = React.useMemo(
    () => ({
      type: toast.type,
    }),
    [toast.type],
  );

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
});

export namespace ToastAction {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
