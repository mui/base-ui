'use client';
import * as React from 'react';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { getOffset } from '../utils/getOffset';
import { ScrollAreaRootCssVars } from '../root/ScrollAreaRootCssVars';
import { ScrollAreaScrollbarCssVars } from './ScrollAreaScrollbarCssVars';
import { useDirection } from '../../direction-provider/DirectionContext';

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

  const {
    hovering,
    scrollingX,
    scrollingY,
    hiddenState,
    scrollbarYRef,
    scrollbarXRef,
    viewportRef,
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerUp,
    rootId,
    thumbSize,
  } = useScrollAreaRootContext();

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

  const direction = useDirection();

  React.useEffect(() => {
    const viewportEl = viewportRef.current;
    const scrollbarEl = orientation === 'vertical' ? scrollbarYRef.current : scrollbarXRef.current;

    if (!scrollbarEl) {
      return undefined;
    }

    function handleWheel(event: WheelEvent) {
      if (!viewportEl || !scrollbarEl || event.ctrlKey) {
        return;
      }

      event.preventDefault();

      if (orientation === 'vertical') {
        if (viewportEl.scrollTop === 0 && event.deltaY < 0) {
          return;
        }
      } else if (viewportEl.scrollLeft === 0 && event.deltaX < 0) {
        return;
      }

      if (orientation === 'vertical') {
        if (
          viewportEl.scrollTop === viewportEl.scrollHeight - viewportEl.clientHeight &&
          event.deltaY > 0
        ) {
          return;
        }
      } else if (
        viewportEl.scrollLeft === viewportEl.scrollWidth - viewportEl.clientWidth &&
        event.deltaX > 0
      ) {
        return;
      }

      if (orientation === 'vertical') {
        viewportEl.scrollTop += event.deltaY;
      } else {
        viewportEl.scrollLeft += event.deltaX;
      }
    }

    scrollbarEl.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollbarEl.removeEventListener('wheel', handleWheel);
    };
  }, [orientation, scrollbarXRef, scrollbarYRef, viewportRef]);

  const props: HTMLProps = {
    ...(rootId && { 'data-id': `${rootId}-scrollbar` }),
    onPointerDown(event) {
      // Ignore clicks on thumb
      if (event.currentTarget !== event.target) {
        return;
      }

      if (!viewportRef.current) {
        return;
      }

      // Handle Y-axis (vertical) scroll
      if (thumbYRef.current && scrollbarYRef.current && orientation === 'vertical') {
        const thumbYOffset = getOffset(thumbYRef.current, 'margin', 'y');
        const scrollbarYOffset = getOffset(scrollbarYRef.current, 'padding', 'y');
        const thumbHeight = thumbYRef.current.offsetHeight;
        const trackRectY = scrollbarYRef.current.getBoundingClientRect();
        const clickY =
          event.clientY - trackRectY.top - thumbHeight / 2 - scrollbarYOffset + thumbYOffset / 2;

        const scrollableContentHeight = viewportRef.current.scrollHeight;
        const viewportHeight = viewportRef.current.clientHeight;

        const maxThumbOffsetY =
          scrollbarYRef.current.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
        const scrollRatioY = clickY / maxThumbOffsetY;
        const newScrollTop = scrollRatioY * (scrollableContentHeight - viewportHeight);

        viewportRef.current.scrollTop = newScrollTop;
      }

      if (thumbXRef.current && scrollbarXRef.current && orientation === 'horizontal') {
        const thumbXOffset = getOffset(thumbXRef.current, 'margin', 'x');
        const scrollbarXOffset = getOffset(scrollbarXRef.current, 'padding', 'x');
        const thumbWidth = thumbXRef.current.offsetWidth;
        const trackRectX = scrollbarXRef.current.getBoundingClientRect();
        const clickX =
          event.clientX - trackRectX.left - thumbWidth / 2 - scrollbarXOffset + thumbXOffset / 2;

        const scrollableContentWidth = viewportRef.current.scrollWidth;
        const viewportWidth = viewportRef.current.clientWidth;

        const maxThumbOffsetX =
          scrollbarXRef.current.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
        const scrollRatioX = clickX / maxThumbOffsetX;

        let newScrollLeft: number;
        if (direction === 'rtl') {
          // In RTL, invert the scroll direction
          newScrollLeft = (1 - scrollRatioX) * (scrollableContentWidth - viewportWidth);

          // Adjust for browsers that use negative scrollLeft in RTL
          if (viewportRef.current.scrollLeft <= 0) {
            newScrollLeft = -newScrollLeft;
          }
        } else {
          newScrollLeft = scrollRatioX * (scrollableContentWidth - viewportWidth);
        }

        viewportRef.current.scrollLeft = newScrollLeft;
      }

      handlePointerDown(event);
    },
    onPointerUp: handlePointerUp,
    style: {
      position: 'absolute',
      touchAction: 'none',
      ...(orientation === 'vertical' && {
        top: 0,
        bottom: `var(${ScrollAreaRootCssVars.scrollAreaCornerHeight})`,
        insetInlineEnd: 0,
        [ScrollAreaScrollbarCssVars.scrollAreaThumbHeight as string]: `${thumbSize.height}px`,
      }),
      ...(orientation === 'horizontal' && {
        insetInlineStart: 0,
        insetInlineEnd: `var(${ScrollAreaRootCssVars.scrollAreaCornerWidth})`,
        bottom: 0,
        [ScrollAreaScrollbarCssVars.scrollAreaThumbWidth as string]: `${thumbSize.width}px`,
      }),
    },
  };

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
