'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useToastContext } from '../provider/ToastProviderContext';
import { useToastViewportContext } from '../viewport/ToastViewportContext';

const state = {};

const ToastClose = React.forwardRef(function ToastClose(
  props: ToastClose.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;

  const { remove, prevFocusRef } = useToastContext();
  const { toast, rootRef } = useToastRootContext();
  const { viewportRef } = useToastViewportContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    ref,
    className,
    state,
    extraProps: mergeReactProps<'button'>(other, {
      onClick() {
        const viewport = viewportRef.current;
        if (!viewport) {
          return;
        }

        const currentToastRoot = rootRef.current;
        if (!currentToastRoot) {
          return;
        }

        const toastElements = Array.from<HTMLElement>(
          viewport.querySelectorAll('[data-base-ui-toast]'),
        );
        const currentIndex = toastElements.indexOf(currentToastRoot);

        remove(toast.id);

        const nextToast = toastElements[currentIndex + 1] || toastElements[currentIndex - 1];

        if (nextToast) {
          nextToast.focus();
        } else {
          prevFocusRef.current?.focus();
        }
      },
    }),
  });

  return renderElement();
});

namespace ToastClose {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}

export { ToastClose };
