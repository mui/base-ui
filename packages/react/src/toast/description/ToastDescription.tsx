'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const state = {};

const ToastDescription = React.forwardRef(function ToastDescription(
  props: ToastDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
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

namespace ToastDescription {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'p', State> {}
}

export { ToastDescription };
