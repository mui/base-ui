'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { ScrollAreaViewportContext } from './ScrollAreaViewportContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useEventCallback } from '../../utils/useEventCallback';
import { useDirection } from '../../direction-provider/DirectionContext';
import { getOffset } from '../utils/getOffset';
import { MIN_THUMB_SIZE } from '../constants';
import { clamp } from '../../utils/clamp';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { onVisible } from '../utils/onVisible';

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaViewport = React.forwardRef(function ScrollAreaViewport(
  componentProps: ScrollAreaViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    cornerRef,
    setCornerSize,
    setThumbSize,
    rootId,
    setHiddenState,
    hiddenState,
    handleScroll,
    setHovering,
  } = useScrollAreaRootContext();

  const direction = useDirection();

  const computeThumbPosition = useEventCallback(() => {
    const viewportEl = viewportRef.current;
    const scrollbarYEl = scrollbarYRef.current;
    const scrollbarXEl = scrollbarXRef.current;
    const thumbYEl = thumbYRef.current;
    const thumbXEl = thumbXRef.current;
    const cornerEl = cornerRef.current;

    if (!viewportEl) {
      return;
    }

    const scrollableContentHeight = viewportEl.scrollHeight;
    const scrollableContentWidth = viewportEl.scrollWidth;
    const viewportHeight = viewportEl.clientHeight;
    const viewportWidth = viewportEl.clientWidth;
    const scrollTop = viewportEl.scrollTop;
    const scrollLeft = viewportEl.scrollLeft;

    if (scrollableContentHeight === 0 || scrollableContentWidth === 0) {
      return;
    }

    const scrollbarYHidden = viewportHeight >= scrollableContentHeight;
    const scrollbarXHidden = viewportWidth >= scrollableContentWidth;
    const ratioX = viewportWidth / scrollableContentWidth;
    const ratioY = viewportHeight / scrollableContentHeight;
    const nextWidth = scrollbarXHidden ? 0 : viewportWidth;
    const nextHeight = scrollbarYHidden ? 0 : viewportHeight;

    const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x');
    const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y');
    const thumbXOffset = getOffset(thumbXEl, 'margin', 'x');
    const thumbYOffset = getOffset(thumbYEl, 'margin', 'y');

    const idealNextWidth = nextWidth - scrollbarXOffset - thumbXOffset;
    const idealNextHeight = nextHeight - scrollbarYOffset - thumbYOffset;

    const maxNextWidth = scrollbarXEl
      ? Math.min(scrollbarXEl.offsetWidth, idealNextWidth)
      : idealNextWidth;
    const maxNextHeight = scrollbarYEl
      ? Math.min(scrollbarYEl.offsetHeight, idealNextHeight)
      : idealNextHeight;

    const clampedNextWidth = Math.max(MIN_THUMB_SIZE, maxNextWidth * ratioX);
    const clampedNextHeight = Math.max(MIN_THUMB_SIZE, maxNextHeight * ratioY);

    setThumbSize((prevSize) => {
      if (prevSize.height === clampedNextHeight && prevSize.width === clampedNextWidth) {
        return prevSize;
      }

      return {
        width: clampedNextWidth,
        height: clampedNextHeight,
      };
    });

    // Handle Y (vertical) scroll
    if (scrollbarYEl && thumbYEl) {
      const maxThumbOffsetY =
        scrollbarYEl.offsetHeight - clampedNextHeight - scrollbarYOffset - thumbYOffset;
      const scrollRatioY = scrollTop / (scrollableContentHeight - viewportHeight);

      // In Safari, don't allow it to go negative or too far as `scrollTop` considers the rubber
      // band effect.
      const thumbOffsetY = Math.min(maxThumbOffsetY, Math.max(0, scrollRatioY * maxThumbOffsetY));

      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX =
        scrollbarXEl.offsetWidth - clampedNextWidth - scrollbarXOffset - thumbXOffset;
      const scrollRatioX = scrollLeft / (scrollableContentWidth - viewportWidth);

      // In Safari, don't allow it to go negative or too far as `scrollLeft` considers the rubber
      // band effect.
      const thumbOffsetX =
        direction === 'rtl'
          ? clamp(scrollRatioX * maxThumbOffsetX, -maxThumbOffsetX, 0)
          : clamp(scrollRatioX * maxThumbOffsetX, 0, maxThumbOffsetX);

      thumbXEl.style.transform = `translate3d(${thumbOffsetX}px,0,0)`;
    }

    if (cornerEl) {
      if (scrollbarXHidden || scrollbarYHidden) {
        setCornerSize({ width: 0, height: 0 });
      } else if (!scrollbarXHidden && !scrollbarYHidden) {
        const width = scrollbarYEl?.offsetWidth || 0;
        const height = scrollbarXEl?.offsetHeight || 0;
        setCornerSize({ width, height });
      }
    }

    setHiddenState((prevState) => {
      const cornerHidden = scrollbarYHidden || scrollbarXHidden;

      if (
        prevState.scrollbarYHidden === scrollbarYHidden &&
        prevState.scrollbarXHidden === scrollbarXHidden &&
        prevState.cornerHidden === cornerHidden
      ) {
        return prevState;
      }

      return {
        scrollbarYHidden,
        scrollbarXHidden,
        cornerHidden,
      };
    });
  });

  useModernLayoutEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    const cleanup = onVisible(viewportRef.current, computeThumbPosition);
    return cleanup;
  }, [computeThumbPosition, viewportRef]);

  useModernLayoutEffect(() => {
    // Wait for scrollbar-related refs to be set
    queueMicrotask(computeThumbPosition);
  }, [computeThumbPosition, hiddenState, direction]);

  useModernLayoutEffect(() => {
    // `onMouseEnter` doesn't fire upon load, so we need to check if the viewport is already
    // being hovered.
    if (viewportRef.current?.matches(':hover')) {
      setHovering(true);
    }
  }, [viewportRef, setHovering]);

  React.useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const ro = new ResizeObserver(computeThumbPosition);

    if (viewportRef.current) {
      ro.observe(viewportRef.current);
    }

    return () => {
      ro.disconnect();
    };
  }, [computeThumbPosition, viewportRef]);

  const props = {
    role: 'presentation',
    ...(rootId && { 'data-id': `${rootId}-viewport` }),
    // https://accessibilityinsights.io/info-examples/web/scrollable-region-focusable/
    ...((!hiddenState.scrollbarXHidden || !hiddenState.scrollbarYHidden) && { tabIndex: 0 }),
    style: {
      overflow: 'scroll',
    },
    onScroll() {
      if (!viewportRef.current) {
        return;
      }

      computeThumbPosition();

      handleScroll({
        x: viewportRef.current.scrollLeft,
        y: viewportRef.current.scrollTop,
      });
    },
  };

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, viewportRef],
    props: [props, elementProps],
  });

  const contextValue: ScrollAreaViewportContext = React.useMemo(
    () => ({
      computeThumbPosition,
    }),
    [computeThumbPosition],
  );

  return (
    <ScrollAreaViewportContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaViewportContext.Provider>
  );
});

export namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
