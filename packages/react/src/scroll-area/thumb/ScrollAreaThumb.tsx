'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useScrollAreaScrollbarContext } from '../scrollbar/ScrollAreaScrollbarContext';
import { ScrollAreaScrollbarCssVars } from '../scrollbar/ScrollAreaScrollbarCssVars';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * The draggable part of the the scrollbar that indicates the current scroll position.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaThumb = React.forwardRef(function ScrollAreaThumb(
  componentProps: ScrollAreaThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setScrollingX,
    setScrollingY,
  } = useScrollAreaRootContext();

  const { orientation } = useScrollAreaScrollbarContext();

  const state: ScrollAreaThumb.State = React.useMemo(() => ({ orientation }), [orientation]);

  const renderElement = useRenderElement('div', componentProps, {
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

  return renderElement();
});

export namespace ScrollAreaThumb {
  export interface State {
    orientation?: 'horizontal' | 'vertical';
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
