import * as React from 'react';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerWindow } from '../../utils/owner';

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
  } = useScrollAreaRootContext();

  const timeoutRef = React.useRef(-1);
  const tableWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const [paddingX, setPaddingX] = React.useState(0);
  const [paddingY, setPaddingY] = React.useState(0);
  const [hiddenX, setHiddenX] = React.useState(false);
  const [hiddenY, setHiddenY] = React.useState(false);

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
      const thumbOffsetY = scrollRatioY * maxThumbOffsetY;

      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;

      if (scrollbarYHidden) {
        scrollbarYEl.setAttribute('hidden', '');
      } else {
        scrollbarYEl.removeAttribute('hidden');
      }

      setHiddenY(scrollbarYHidden);

      scrollbarYEl.style.setProperty(
        '--scroll-area-thumb-height',
        scrollbarYHidden
          ? '0px'
          : `${(viewportHeight / scrollableContentHeight) * viewportHeight}px`,
      );
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const thumbWidth = thumbXEl.offsetWidth;
      const scrollbarStylesX = getComputedStyle(scrollbarXEl);
      const paddingLeft = parseFloat(scrollbarStylesX.paddingLeft);
      const paddingRight = parseFloat(scrollbarStylesX.paddingRight);

      const maxThumbOffsetX = scrollbarXEl.offsetWidth - thumbWidth - (paddingLeft + paddingRight);
      const scrollRatioX = scrollLeft / (scrollableContentWidth - viewportWidth);
      const thumbOffsetX = scrollRatioX * maxThumbOffsetX;

      thumbXEl.style.transform = `translate3d(${thumbOffsetX}px,0,0)`;

      if (scrollbarXHidden) {
        scrollbarXEl.setAttribute('hidden', '');
      } else {
        scrollbarXEl.removeAttribute('hidden');
      }

      setHiddenX(scrollbarXHidden);

      scrollbarXEl.style.setProperty(
        '--scroll-area-thumb-width',
        scrollbarXHidden ? '0px' : `${(viewportWidth / scrollableContentWidth) * viewportWidth}px`,
      );
    }

    if (cornerEl) {
      if (scrollbarXHidden || scrollbarYHidden) {
        cornerEl.setAttribute('hidden', '');
        setCornerSize({ width: 0, height: 0 });
      } else if (!scrollbarXHidden && !scrollbarYHidden) {
        cornerEl.removeAttribute('hidden');
        const width = scrollbarYRef.current?.offsetWidth || 0;
        const height = scrollbarXRef.current?.offsetHeight || 0;
        setCornerSize({ width, height });
      }
    }
  });

  useEnhancedEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    function handleResize() {
      if (scrollbarYRef.current) {
        setPaddingX(scrollbarYRef.current.offsetWidth);
      }
      if (scrollbarXRef.current) {
        setPaddingY(scrollbarXRef.current.offsetHeight);
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
    if (!tableWrapperRef.current || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const ro = new ResizeObserver(computeThumb);
    ro.observe(tableWrapperRef.current);

    return () => {
      ro.disconnect();
    };
  }, [computeThumb]);

  const wrapperStyles: React.CSSProperties = React.useMemo(() => ({}), []);

  if (type === 'inlay') {
    if (!hiddenY) {
      wrapperStyles.paddingRight = paddingX;
    }
    if (!hiddenX) {
      wrapperStyles.paddingBottom = paddingY;
    }

    if (hiddenY) {
      if (gutter === 'stable') {
        wrapperStyles[dir === 'rtl' ? 'paddingLeft' : 'paddingRight'] = paddingX;
      } else if (gutter === 'both-edges') {
        wrapperStyles.paddingLeft = paddingX;
        wrapperStyles.paddingRight = paddingX;
      }
    }
  }

  const getViewportProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        style: {
          overflow: 'scroll',
        },
        onScroll() {
          computeThumb();
          setScrolling(true);

          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => {
            setScrolling(false);
          }, 500);
        },
        children: (
          <div
            ref={tableWrapperRef}
            style={{
              display: 'table',
              minWidth: '100%',
              ...wrapperStyles,
            }}
          >
            {children}
          </div>
        ),
      }),
    [children, computeThumb, setScrolling, wrapperStyles],
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
