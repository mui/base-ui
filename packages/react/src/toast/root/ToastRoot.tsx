'use client';
import * as React from 'react';
import type { Toast } from '../provider/ToastProviderContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ToastRootContext } from './ToastRootContext';
import { useForkRef } from '../../utils/useForkRef';

const state = {};

const ToastRoot = React.forwardRef(function ToastRoot(
  props: ToastRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { toast, render, className, ...other } = props;

  const rootRef = React.useRef<HTMLDivElement>(null);
  const mergedRef = useForkRef(rootRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: {
      role: toast.priority === 'high' ? 'alertdialog' : 'dialog',
      'aria-modal': false,
      tabIndex: 0,
      'data-base-ui-toast': '',
      ...other,
    },
  });

  const contextValue = React.useMemo(() => ({ toast, rootRef }), [toast]);

  return (
    <ToastRootContext.Provider value={contextValue}>{renderElement()}</ToastRootContext.Provider>
  );
});

namespace ToastRoot {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    toast: Toast;
  }
}

export { ToastRoot };
