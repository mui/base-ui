'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useToastLabelPart } from '../utils/useToastLabelPart';

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastTitle = React.forwardRef(function ToastTitle(
  componentProps: ToastTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const {
    render,
    className,
    style,
    id: idProp,
    children: childrenProp,
    ...elementProps
  } = componentProps;

  const { id, children, shouldRender, type } = useToastLabelPart(idProp, childrenProp, 'title');

  const state: ToastTitleState = { type };

  const element = useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    state,
    props: { ...elementProps, id, children },
  });

  return shouldRender ? element : null;
});

export interface ToastTitleState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}

export interface ToastTitleProps extends BaseUIComponentProps<'h2', ToastTitleState> {}

export namespace ToastTitle {
  export type State = ToastTitleState;
  export type Props = ToastTitleProps;
}
