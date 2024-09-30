'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';

/**
 *
 * Demos:
 *
 * - [Scroll Area](https://base-ui.netlify.app/components/react-scroll-area/)
 *
 * API:
 *
 * - [ScrollAreaScrollbar API](https://base-ui.netlify.app/components/react-scroll-area/#api-reference-ScrollAreaScrollbar)
 */
const ScrollAreaScrollbar = React.forwardRef(function ScrollAreaScrollbar(
  props: ScrollAreaScrollbar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, orientation = 'vertical', ...otherProps } = props;

  const {
    dir,
    hovering,
    scrolling,
    scrollbarYRef,
    scrollbarXRef,
    viewportRef,
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerUp,
  } = useScrollAreaRootContext();

  const mergedRef = useForkRef(
    forwardedRef,
    orientation === 'vertical' ? scrollbarYRef : scrollbarXRef,
  );

  const ownerState: ScrollAreaScrollbar.OwnerState = React.useMemo(
    () => ({
      hovering,
      scrolling,
      orientation,
    }),
    [hovering, scrolling, orientation],
  );

  React.useEffect(() => {
    const viewportEl = viewportRef.current;
    const scrollbarEl = orientation === 'vertical' ? scrollbarYRef.current : scrollbarXRef.current;

    function handleWheel(event: WheelEvent) {
      if (!viewportEl || !scrollbarEl) {
        return;
      }

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

      event.preventDefault();

      if (orientation === 'vertical') {
        viewportEl.scrollTop += event.deltaY;
      } else {
        viewportEl.scrollLeft += event.deltaX;
      }
    }

    scrollbarEl?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollbarEl?.removeEventListener('wheel', handleWheel);
    };
  }, [orientation, scrollbarXRef, scrollbarYRef, thumbYRef, viewportRef]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    ownerState,
    extraProps: mergeReactProps<'div'>(otherProps, {
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
          const thumbHeight = thumbYRef.current.offsetHeight;
          const trackRectY = scrollbarYRef.current.getBoundingClientRect();
          const clickY = event.clientY - trackRectY.top - thumbHeight / 2;

          const scrollableContentHeight = viewportRef.current.scrollHeight;
          const viewportHeight = viewportRef.current.clientHeight;

          const maxThumbOffsetY = scrollbarYRef.current.offsetHeight - thumbHeight;
          const scrollRatioY = clickY / maxThumbOffsetY;
          const newScrollTop = scrollRatioY * (scrollableContentHeight - viewportHeight);

          viewportRef.current.scrollTop = newScrollTop;
        }

        // Handle X-axis (horizontal) scroll
        if (thumbXRef.current && scrollbarXRef.current && orientation === 'horizontal') {
          const thumbWidth = thumbXRef.current.offsetWidth;
          const trackRectX = scrollbarXRef.current.getBoundingClientRect();
          const clickX = event.clientX - trackRectX.left - thumbWidth / 2;

          const scrollableContentWidth = viewportRef.current.scrollWidth;
          const viewportWidth = viewportRef.current.clientWidth;

          const maxThumbOffsetX = scrollbarXRef.current.offsetWidth - thumbWidth;
          const scrollRatioX = clickX / maxThumbOffsetX;
          const newScrollLeft = scrollRatioX * (scrollableContentWidth - viewportWidth);

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
          bottom: 0,
          [dir === 'rtl' ? 'left' : 'right']: 0,
        }),
        ...(orientation === 'horizontal' && {
          left: 0,
          right: 0,
          bottom: 0,
        }),
      },
    }),
  });

  const contextValue = React.useMemo(() => ({ orientation }), [orientation]);

  return (
    <ScrollAreaScrollbarContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaScrollbarContext.Provider>
  );
});

namespace ScrollAreaScrollbar {
  export interface OwnerState {
    hovering: boolean;
    scrolling: boolean;
    orientation: 'vertical' | 'horizontal';
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The orientation of the scrollbar.
     * @default 'vertical'
     */
    orientation?: 'vertical' | 'horizontal';
  }
}

ScrollAreaScrollbar.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The orientation of the scrollbar.
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ScrollAreaScrollbar };
