'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An icon that indicates that the trigger button opens a select menu.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectIcon = React.forwardRef(function SelectIcon(
  componentProps: SelectIcon.Props,
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

export namespace SelectIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
