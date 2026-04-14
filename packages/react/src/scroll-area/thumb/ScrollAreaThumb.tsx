'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useScrollAreaScrollbarContext } from '../scrollbar/ScrollAreaScrollbarContext';
import { ScrollAreaScrollbarCssVars } from '../scrollbar/ScrollAreaScrollbarCssVars';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * The draggable part of the scrollbar that indicates the current scroll position.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaThumb = React.forwardRef(function ScrollAreaThumb(
  componentProps: ScrollAreaThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const {
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setScrollingX,
    setScrollingY,
    hasMeasuredScrollbar,
  } = useScrollAreaRootContext();

  const { orientation } = useScrollAreaScrollbarContext();

  const state: ScrollAreaThumbState = { orientation };

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, orientation === 'vertical' ? thumbYRef : thumbXRef],
    state,
    props: [
      {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp(event) {
          if (orientation === 'vertical') {
            setScrollingY(false);
          }
          if (orientation === 'horizontal') {
            setScrollingX(false);
          }
          handlePointerUp(event);
        },
        style: {
          visibility: hasMeasuredScrollbar ? undefined : 'hidden',
          ...(orientation === 'vertical' && {
            height: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbHeight})`,
          }),
          ...(orientation === 'horizontal' && {
            width: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbWidth})`,
          }),
        },
      },
      elementProps,
    ],
  });

  return element;
});

export interface ScrollAreaThumbState {
  /**
   * The component orientation.
   */
  orientation?: 'horizontal' | 'vertical' | undefined;
}

export interface ScrollAreaThumbProps extends BaseUIComponentProps<'div', ScrollAreaThumbState> {}

export namespace ScrollAreaThumb {
  export type State = ScrollAreaThumbState;
  export type Props = ScrollAreaThumbProps;
}
