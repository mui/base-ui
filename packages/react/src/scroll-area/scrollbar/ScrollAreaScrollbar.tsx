'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { useScrollAreaScrollbar } from './useScrollAreaScrollbar';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaScrollbar = React.forwardRef(function ScrollAreaScrollbar(
  componentProps: ScrollAreaScrollbar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    orientation = 'vertical',
    keepMounted = false,
    ...elementProps
  } = componentProps;

  const { hovering, scrollingX, scrollingY, hiddenState, scrollbarYRef, scrollbarXRef } =
    useScrollAreaRootContext();

  const state: ScrollAreaScrollbar.State = React.useMemo(
    () => ({
      hovering,
      scrolling: {
        horizontal: scrollingX,
        vertical: scrollingY,
      }[orientation],
      orientation,
    }),
    [hovering, scrollingX, scrollingY, orientation],
  );

  const { props } = useScrollAreaScrollbar({
    orientation,
  });

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, orientation === 'vertical' ? scrollbarYRef : scrollbarXRef],
    state,
    props: [props, elementProps],
  });

  const contextValue = React.useMemo(() => ({ orientation }), [orientation]);

  const isHidden =
    orientation === 'vertical' ? hiddenState.scrollbarYHidden : hiddenState.scrollbarXHidden;

  const shouldRender = keepMounted || !isHidden;
  if (!shouldRender) {
    return null;
  }

  return (
    <ScrollAreaScrollbarContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaScrollbarContext.Provider>
  );
});

export namespace ScrollAreaScrollbar {
  export interface State {
    hovering: boolean;
    scrolling: boolean;
    orientation: 'vertical' | 'horizontal';
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the scrollbar controls vertical or horizontal scroll.
     * @default 'vertical'
     */
    orientation?: 'vertical' | 'horizontal';
    /**
     * Whether to keep the HTML element in the DOM when the viewport isn’t scrollable.
     * @default false
     */
    keepMounted?: boolean;
  }
}
