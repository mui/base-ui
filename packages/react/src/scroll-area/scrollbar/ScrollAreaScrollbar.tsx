'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { useScrollAreaScrollbar } from './useScrollAreaScrollbar';

/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaScrollbar = React.forwardRef(function ScrollAreaScrollbar(
  props: ScrollAreaScrollbar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, orientation = 'vertical', keepMounted = false, ...otherProps } = props;

  const { hovering, scrollingX, scrollingY, hiddenState, scrollbarYRef, scrollbarXRef } =
    useScrollAreaRootContext();

  const mergedRef = useForkRef(
    forwardedRef,
    orientation === 'vertical' ? scrollbarYRef : scrollbarXRef,
  );

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

  const { getScrollbarProps } = useScrollAreaScrollbar({
    orientation,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getScrollbarProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: otherProps,
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
