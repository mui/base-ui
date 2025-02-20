'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const state = {};

const ToastTitle = React.forwardRef(function ToastTitle(
  props: ToastTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...other } = props;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h2',
    ref: forwardedRef,
    className,
    state,
    extraProps: other,
  });

  return renderElement();
});

namespace ToastTitle {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'h2', State> {}
}

export { ToastTitle };
