'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { ToastObject as ToastObjectType } from '../useToastManager';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ToastRootContext } from './ToastRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useToastRoot } from './useToastRoot';
import { useToastContext } from '../provider/ToastProviderContext';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<ToastRoot.State> = {
  ...transitionStatusMapping,
  swipeDirection(value) {
    return value ? { 'data-swipe-direction': value } : null;
  },
};

/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastRoot = React.forwardRef(function ToastRoot(
  props: ToastRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { toast, render, className, children, swipeDirection, ...other } = props;

  const { hovering, focused, hasDifferingHeights } = useToastContext();

  const toastRoot = useToastRoot({
    toast,
    swipeDirection: swipeDirection ?? ['down', 'right'],
  });

  const mergedRef = useForkRef(toastRoot.rootRef, forwardedRef);

  const state: ToastRoot.State = React.useMemo(
    () => ({
      transitionStatus: toast.transitionStatus,
      expanded: hovering || focused || hasDifferingHeights,
      limited: toast.limited || false,
      type: toast.type,
      swiping: toastRoot.swiping,
      swipeDirection: toastRoot.swipeDirection,
    }),
    [
      hovering,
      focused,
      hasDifferingHeights,
      toast.transitionStatus,
      toast.limited,
      toast.type,
      toastRoot.swiping,
      toastRoot.swipeDirection,
    ],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping,
    propGetter: toastRoot.getRootProps,
    extraProps: {
      ...other,
      // Screen readers won't announce the text upon DOM insertion of the component.
      // We need to wait until the next tick to render the children so that screen
      // readers can announce the contents.
      children: (
        <React.Fragment>
          {children}
          {!focused && (
            <div
              style={visuallyHidden}
              {...(toast.priority === 'high'
                ? { role: 'alert', 'aria-atomic': true }
                : { role: 'status', 'aria-live': 'polite' })}
            >
              {toastRoot.renderScreenReaderContent && (
                <React.Fragment>
                  {toast.title && <div>{toast.title}</div>}
                  {toast.description && <div>{toast.description}</div>}
                </React.Fragment>
              )}
            </div>
          )}
        </React.Fragment>
      ),
    },
  });

  return <ToastRootContext.Provider value={toastRoot}>{renderElement()}</ToastRootContext.Provider>;
});

export namespace ToastRoot {
  export type ToastObject<Data extends object = any> = ToastObjectType<Data>;

  export interface State {
    transitionStatus: TransitionStatus;
    /**
     * Whether the toasts in the viewport are expanded.
     */
    expanded: boolean;
    /**
     * Whether the toast was removed due to exceeding the limit.
     */
    limited: boolean;
    /**
     * The type of the toast.
     */
    type: string | undefined;
    /**
     * Whether the toast is being swiped.
     */
    swiping: boolean;
    /**
     * The direction the toast is being swiped.
     */
    swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The toast to render.
     */
    toast: ToastObject<any>;
    /**
     * Direction(s) in which the toast can be swiped to dismiss.
     * Defaults to `['down', 'right']`.
     */
    swipeDirection?: 'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[];
  }
}
