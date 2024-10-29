import * as React from 'react';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerWindow } from '../../utils/owner';
import { SCROLL_TIMEOUT } from '../constants';

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
    if (scrollbarYEl) {
      if (thumbYEl) {
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

      scrollbarYEl.style.setProperty(
        '--scroll-area-thumb-height',
        scrollbarYHidden
          ? '0px'
          : `${(viewportHeight / scrollableContentHeight) * viewportHeight}px`,
      );
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl) {
      if (thumbXEl) {
        const thumbWidth = thumbXEl.offsetWidth;
        const scrollbarStylesX = getComputedStyle(scrollbarXEl);
        const paddingLeft = parseFloat(scrollbarStylesX.paddingLeft);
        const paddingRight = parseFloat(scrollbarStylesX.paddingRight);

        const maxThumbOffsetX =
          scrollbarXEl.offsetWidth - thumbWidth - (paddingLeft + paddingRight);
        const scrollRatioX = scrollLeft / (scrollableContentWidth - viewportWidth);

        // In Safari, don't allow it to go negative or too far as `scrollLeft` considers the rubber
        // band effect.
        const thumbOffsetX = Math.min(maxThumbOffsetX, Math.max(0, scrollRatioX * maxThumbOffsetX));

        thumbXEl.style.transform = `translate3d(${thumbOffsetX}px,0,0)`;
      }

      scrollbarXEl.style.setProperty(
        '--scroll-area-thumb-width',
        scrollbarXHidden ? '0px' : `${(viewportWidth / scrollableContentWidth) * viewportWidth}px`,
      );
    }

    if (cornerEl) {
      if (scrollbarXHidden || scrollbarYHidden) {
        setCornerSize({ width: 0, height: 0 });
      } else if (!scrollbarXHidden && !scrollbarYHidden) {
        const width = scrollbarYRef.current?.offsetWidth || 0;
        const height = scrollbarXRef.current?.offsetHeight || 0;
        setCornerSize({ width, height });
      }
    }

    setHiddenState({
      scrollbarYHidden,
      scrollbarXHidden,
      cornerHidden: scrollbarYHidden || scrollbarXHidden,
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

  const wrapperStyles: React.CSSProperties = React.useMemo(() => {
    const styles: React.CSSProperties = {};

    if (type === 'inset') {
      if (!hiddenState.scrollbarYHidden) {
        styles[dir === 'rtl' ? 'paddingLeft' : 'paddingRight'] = paddingX;
      }
      if (!hiddenState.scrollbarXHidden) {
        styles.paddingBottom = paddingY;
      }

      if (hiddenState.scrollbarYHidden) {
        if (gutter === 'stable') {
          styles[dir === 'rtl' ? 'paddingLeft' : 'paddingRight'] = paddingX;
        } else if (gutter === 'both-edges') {
          styles.paddingLeft = paddingX;
          styles.paddingRight = paddingX;
        }
      }
    }

    return styles;
  }, [type, hiddenState, paddingX, paddingY, dir, gutter]);

  const getViewportProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        ...(rootId && { id: `${rootId}-viewport` }),
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
    [children, computeThumb, setScrolling, wrapperStyles, rootId],
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
