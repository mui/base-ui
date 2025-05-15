'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaCorner = React.forwardRef(function ScrollAreaCorner(
  componentProps: ScrollAreaCorner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { cornerRef, cornerSize, hiddenState } = useScrollAreaRootContext();

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, cornerRef],
    props: [
      {
        style: {
          position: 'absolute',
          bottom: 0,
          insetInlineEnd: 0,
          width: cornerSize.width,
          height: cornerSize.height,
        },
      },
      elementProps,
    ],
  });

  if (hiddenState.cornerHidden) {
    return null;
  }

  return renderElement();
});

export namespace ScrollAreaCorner {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
