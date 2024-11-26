import * as React from 'react';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useScrollAreaScrollbar(params: useScrollAreaScrollbar.Parameters) {
  const { orientation } = params;

  const {
    dir,
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

  const getScrollbarProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
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

          if (thumbXRef.current && scrollbarXRef.current && orientation === 'horizontal') {
            const thumbWidth = thumbXRef.current.offsetWidth;
            const trackRectX = scrollbarXRef.current.getBoundingClientRect();
            const clickX = event.clientX - trackRectX.left - thumbWidth / 2;

            const scrollableContentWidth = viewportRef.current.scrollWidth;
            const viewportWidth = viewportRef.current.clientWidth;

            const maxThumbOffsetX = scrollbarXRef.current.offsetWidth - thumbWidth;
            const scrollRatioX = clickX / maxThumbOffsetX;

            let newScrollLeft: number;
            if (dir === 'rtl') {
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
            bottom: 'var(--scroll-area-corner-height)',
            [dir === 'rtl' ? 'left' : 'right']: 0,
            ['--scroll-area-thumb-height' as string]: `${thumbSize.height}px`,
          }),
          ...(orientation === 'horizontal' && {
            [dir === 'rtl' ? 'right' : 'left']: 0,
            [dir === 'rtl' ? 'left' : 'right']: 'var(--scroll-area-corner-width)',
            bottom: 0,
            ['--scroll-area-thumb-width' as string]: `${thumbSize.width}px`,
          }),
        },
      }),
    [
      rootId,
      handlePointerUp,
      orientation,
      dir,
      thumbSize.height,
      thumbSize.width,
      viewportRef,
      thumbYRef,
      scrollbarYRef,
      thumbXRef,
      scrollbarXRef,
      handlePointerDown,
    ],
  );

  return React.useMemo(
    () => ({
      getScrollbarProps,
    }),
    [getScrollbarProps],
  );
}

export namespace useScrollAreaScrollbar {
  export interface Parameters {
    orientation: 'vertical' | 'horizontal';
  }
}
