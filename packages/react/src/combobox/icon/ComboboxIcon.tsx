'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An icon that indicates that the trigger button opens the popup.
 * Renders a `<span>` element.
 */
export const ComboboxIcon = React.forwardRef(function ComboboxIcon(
  componentProps: ComboboxIcon.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const element = useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [
      {
        'aria-hidden': true,
        children: '▼',
      },
      elementProps,
    ],
  });

  return element;
});

export namespace ComboboxIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
