'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useToastLabelElement, useToastLabelPart } from '../utils/useToastLabelPart';

/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastDescription = React.forwardRef(function ToastDescription(
  componentProps: ToastDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const {
    render,
    className,
    style,
    id: idProp,
    children: childrenProp,
    ...elementProps
  } = componentProps;

  const { id, children, type, setId } = useToastLabelPart(idProp, childrenProp, 'description');

  const state: ToastDescriptionState = { type };

  const element = useRenderElement('p', componentProps, {
    ref: forwardedRef,
    state,
    props: { ...elementProps, id, children },
  });

  return useToastLabelElement(element, id, setId);
});

export interface ToastDescriptionState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}

export interface ToastDescriptionProps extends BaseUIComponentProps<'p', ToastDescriptionState> {}

export namespace ToastDescription {
  export type State = ToastDescriptionState;
  export type Props = ToastDescriptionProps;
}
