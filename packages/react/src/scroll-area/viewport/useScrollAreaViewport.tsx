import * as React from 'react';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { clamp } from '../../utils/clamp';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { MIN_THUMB_SIZE } from '../constants';
import { getOffset } from '../utils/getOffset';

export function useScrollAreaViewport(params: useScrollAreaViewport.Parameters) {
  const { children } = params;

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

  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const computeThumb = useEventCallback(() => {
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

    const scrollbarYHidden = viewportHeight >= scrollableContentHeight;
    const scrollbarXHidden = viewportWidth >= scrollableContentWidth;

    const nextWidth = scrollbarXHidden
      ? 0
      : (viewportWidth / scrollableContentWidth) * viewportWidth;
    const nextHeight = scrollbarYHidden
      ? 0
      : (viewportHeight / scrollableContentHeight) * viewportHeight;

    const scrollbarXOffset = getOffset(scrollbarXEl, 'padding', 'x');
    const scrollbarYOffset = getOffset(scrollbarYEl, 'padding', 'y');
    const thumbXOffset = getOffset(thumbXEl, 'margin', 'x');
    const thumbYOffset = getOffset(thumbYEl, 'margin', 'y');

    const clampedNextWidth = Math.max(MIN_THUMB_SIZE, nextWidth - scrollbarXOffset - thumbXOffset);
    const clampedNextHeight = Math.max(
      MIN_THUMB_SIZE,
      nextHeight - scrollbarYOffset - thumbYOffset,
    );

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

  useEnhancedEffect(() => {
    // First load computation.
    // Wait for the scrollbar-related refs to be set.
    queueMicrotask(computeThumb);
  }, [computeThumb]);

  useEnhancedEffect(() => {
    computeThumb();
  }, [computeThumb, hiddenState, direction]);

  useEnhancedEffect(() => {
    // `onMouseEnter` doesn't fire upon load, so we need to check if the viewport is already
    // being hovered.
    if (viewportRef.current?.matches(':hover')) {
      setHovering(true);
    }
  }, [viewportRef, setHovering]);

  React.useEffect(() => {
    if (
      !contentWrapperRef.current ||
      !viewportRef.current ||
      typeof ResizeObserver === 'undefined'
    ) {
      return undefined;
    }

    const ro = new ResizeObserver(computeThumb);
    ro.observe(contentWrapperRef.current);
    ro.observe(viewportRef.current);

    return () => {
      ro.disconnect();
    };
  }, [computeThumb, viewportRef]);

  const getViewportProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
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

          computeThumb();

          handleScroll({
            x: viewportRef.current.scrollLeft,
            y: viewportRef.current.scrollTop,
          });
        },
        children: (
          <div
            ref={contentWrapperRef}
            style={{
              minWidth: 'fit-content',
            }}
          >
            {children}
          </div>
        ),
      }),
    [
      rootId,
      hiddenState.scrollbarXHidden,
      hiddenState.scrollbarYHidden,
      children,
      computeThumb,
      handleScroll,
      viewportRef,
    ],
  );

  return React.useMemo(
    () => ({
      getViewportProps,
    }),
    [getViewportProps],
  );
}

namespace useScrollAreaViewport {
  export interface Parameters {
    children?: React.ReactNode;
  }
}
