'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../utils/types';
import { useToastRootContext } from '../root/ToastRootContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A container for the contents of a toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastContent = React.forwardRef(function ToastContent(
  componentProps: ToastContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { visibleIndex, expanded, recalculateHeight } = useToastRootContext();

  const contentRef = React.useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return undefined;
    }

    recalculateHeight();

    if (typeof ResizeObserver !== 'function') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(recalculateHeight);
    resizeObserver.observe(node);
    return () => {
      resizeObserver.disconnect();
    };
  }, [recalculateHeight]);

  const behind = visibleIndex > 0;

  const state: ToastContent.State = React.useMemo(
    () => ({
      expanded,
      behind,
    }),
    [expanded, behind],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, contentRef],
    state,
    props: elementProps,
  });

  return element;
});

export interface ToastContentState {
  /**
   * Whether the toast viewport is expanded.
   */
  expanded: boolean;
  /**
   * Whether the toast is behind the frontmost toast in the stack.
   */
  behind: boolean;
}

export interface ToastContentProps extends BaseUIComponentProps<'div', ToastContent.State> {}

export namespace ToastContent {
  export type State = ToastContentState;
  export type Props = ToastContentProps;
}
