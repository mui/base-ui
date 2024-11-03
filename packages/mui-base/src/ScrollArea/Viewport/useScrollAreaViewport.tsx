import * as React from 'react';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerWindow } from '../../utils/owner';
import { MIN_THUMB_SIZE, SCROLL_TIMEOUT } from '../constants';

export function useScrollAreaViewport(params: useScrollAreaViewport.Parameters) {
  const { children } = params;

  const {
    type,
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    cornerRef,
    setScrolling,
    dir,
    gutter,
    setCornerSize,
    setThumbSize,
    rootId,
    setHiddenState,
    hiddenState,
  } = useScrollAreaRootContext();

  const timeoutRef = React.useRef(-1);
  const contentWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const [paddingX, setPaddingX] = React.useState(0);
  const [paddingY, setPaddingY] = React.useState(0);

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

    // Handle Y (vertical) scroll
    if (scrollbarYEl && thumbYEl) {
      const thumbHeight = thumbYEl.offsetHeight;
      const scrollbarStylesY = getComputedStyle(scrollbarYEl);
      const paddingTop = parseFloat(scrollbarStylesY.paddingTop);
      const paddingBottom = parseFloat(scrollbarStylesY.paddingBottom);

      const maxThumbOffsetY =
        scrollbarYEl.offsetHeight - thumbHeight - (paddingTop + paddingBottom);
      const scrollRatioY = scrollTop / (scrollableContentHeight - viewportHeight);

      // In Safari, don't allow it to go negative or too far as `scrollTop` considers the rubber
      // band effect.
      const thumbOffsetY = Math.min(maxThumbOffsetY, Math.max(0, scrollRatioY * maxThumbOffsetY));

      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const thumbWidth = thumbXEl.offsetWidth;
      const scrollbarStylesX = getComputedStyle(scrollbarXEl);
      const paddingLeft = parseFloat(scrollbarStylesX.paddingLeft);
      const paddingRight = parseFloat(scrollbarStylesX.paddingRight);

      const maxThumbOffsetX = scrollbarXEl.offsetWidth - thumbWidth - (paddingLeft + paddingRight);
      const scrollRatioX = scrollLeft / (scrollableContentWidth - viewportWidth);

      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

      // In Safari, don't allow it to go negative or too far as `scrollLeft` considers the rubber
      // band effect.
      const thumbOffsetX =
        dir === 'rtl'
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

    setThumbSize((prevSize) => {
      const width = scrollbarXHidden ? 0 : (viewportWidth / scrollableContentWidth) * viewportWidth;
      const height = scrollbarYHidden
        ? 0
        : (viewportHeight / scrollableContentHeight) * viewportHeight;

      const clampedWidth = Math.max(MIN_THUMB_SIZE, width);
      const clampedHeight = Math.max(MIN_THUMB_SIZE, height);

      if (prevSize.height === clampedHeight && prevSize.width === clampedWidth) {
        return prevSize;
      }

      return {
        width: clampedWidth,
        height: clampedHeight,
      };
    });

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
    if (!viewportRef.current) {
      return undefined;
    }

    function handleResize() {
      // Parse computed styles as the scrollbars may not be rendered to measure.
      if (scrollbarYRef.current) {
        setPaddingX(
          scrollbarYRef.current.offsetWidth ||
            parseFloat(getComputedStyle(scrollbarYRef.current).width),
        );
      }
      if (scrollbarXRef.current) {
        setPaddingY(
          scrollbarXRef.current.offsetHeight ||
            parseFloat(getComputedStyle(scrollbarXRef.current).height),
        );
      }

      computeThumb();
    }

    // Wait for the scrollbar-related refs to be set.
    queueMicrotask(handleResize);

    const win = ownerWindow(viewportRef.current);

    win.addEventListener('resize', handleResize);

    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, [scrollbarYRef, scrollbarXRef, viewportRef, computeThumb]);

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

  useEnhancedEffect(() => {
    computeThumb();
  }, [hiddenState, computeThumb]);

  const wrapperStyles: React.CSSProperties = React.useMemo(() => {
    const styles: React.CSSProperties = {};

    if (type === 'inset') {
      if (!hiddenState.scrollbarYHidden) {
        styles[dir === 'rtl' ? 'paddingLeft' : 'paddingRight'] = paddingX;
      }

      if (!hiddenState.scrollbarXHidden) {
        styles.paddingBottom = paddingY;
      }

      if (hiddenState.scrollbarYHidden && gutter === 'stable') {
        styles[dir === 'rtl' ? 'paddingLeft' : 'paddingRight'] = paddingX;
      }
    }

    return styles;
  }, [type, hiddenState, paddingX, paddingY, dir, gutter]);

  const getViewportProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        ...(rootId && { id: `${rootId}-viewport` }),
        // https://accessibilityinsights.io/info-examples/web/scrollable-region-focusable/
        ...((!hiddenState.scrollbarXHidden || !hiddenState.scrollbarYHidden) && { tabIndex: 0 }),
        style: {
          overflow: 'scroll',
        },
        onScroll() {
          computeThumb();
          setScrolling(true);

          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => {
            setScrolling(false);
          }, SCROLL_TIMEOUT);
        },
        children: (
          <div
            ref={contentWrapperRef}
            style={{
              minWidth: 'fit-content',
              ...wrapperStyles,
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
      wrapperStyles,
      children,
      computeThumb,
      setScrolling,
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
