'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';

const state = {};

const ToastContent = React.forwardRef(function ToastContent(
  props: ToastContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...other } = props;

  const { toast } = useToastRootContext();

  const [renderChildren, setRenderChildren] = React.useState(false);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: mergeReactProps<'div'>(other, {
      ...(toast.priority === 'high'
        ? {
            role: 'alert',
            'aria-atomic': true,
          }
        : {
            role: 'status',
            'aria-live': 'polite',
          }),
      // Screen readers won't announce role=status aria-live=polite upon DOM insertion
      // of the component. We need to wait until the next tick to render the children
      // so that screen readers can announce the toast.
      children: renderChildren ? children : null,
    }),
  });

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setRenderChildren(true);
    });
    return () => clearTimeout(timeout);
  }, []);

  return (
    <React.Fragment>
      {renderElement()}
      {!renderChildren && <div aria-hidden>{children}</div>}
    </React.Fragment>
  );
});

namespace ToastContent {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { ToastContent };
