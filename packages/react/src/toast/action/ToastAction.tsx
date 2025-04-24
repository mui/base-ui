'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button/useButton';

/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastAction = React.forwardRef(function ToastAction(
  props: ToastAction.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled, ...other } = props;

  const { toast } = useToastRootContext();

  const computedChildren = toast.actionProps?.children ?? other.children;
  const shouldRender = Boolean(computedChildren);

  const { getButtonProps } = useButton({
    disabled,
    buttonRef: forwardedRef,
  });

  const state: ToastAction.State = React.useMemo(
    () => ({
      type: toast.type,
    }),
    [toast.type],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    ref: forwardedRef,
    className,
    state,
    extraProps: mergeProps<'button'>(toast.actionProps, other, getButtonProps, {
      children: computedChildren,
    }),
  });

  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace ToastAction {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {}
}

export { ToastAction };
