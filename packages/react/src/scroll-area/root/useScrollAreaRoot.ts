import * as React from 'react';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { SCROLL_TIMEOUT } from '../constants';

interface Size {
  width: number;
  height: number;
}

export function useScrollAreaRoot(params: useScrollAreaRoot.Parameters) {
  const { dir: dirParam } = params;

  const [hovering, setHovering] = React.useState(false);
  const [scrolling, setScrolling] = React.useState(false);
  const [cornerSize, setCornerSize] = React.useState<Size>({ width: 0, height: 0 });
  const [thumbSize, setThumbSize] = React.useState<Size>({ width: 0, height: 0 });
  const [touchModality, setTouchModality] = React.useState(false);

  const rootId = useId();

  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const scrollbarYRef = React.useRef<HTMLDivElement | null>(null);
  const scrollbarXRef = React.useRef<HTMLDivElement | null>(null);
  const thumbYRef = React.useRef<HTMLDivElement | null>(null);
  const thumbXRef = React.useRef<HTMLDivElement | null>(null);
  const cornerRef = React.useRef<HTMLDivElement | null>(null);

  const thumbDraggingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const startXRef = React.useRef(0);
  const startScrollTopRef = React.useRef(0);
  const startScrollLeftRef = React.useRef(0);
  const currentOrientationRef = React.useRef<'vertical' | 'horizontal'>('vertical');
  const timeoutRef = React.useRef(-1);

  const [hiddenState, setHiddenState] = React.useState({
    scrollbarYHidden: false,
    scrollbarXHidden: false,
    cornerHidden: false,
  });

  const [autoDir, setAutoDir] = React.useState(dirParam);
  const dir = dirParam ?? autoDir;

  useEnhancedEffect(() => {
    if (dirParam === undefined && viewportRef.current) {
      setAutoDir(getComputedStyle(viewportRef.current).direction);
    }
  }, [dirParam]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleScroll = useEventCallback(() => {
    setScrolling(true);

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setScrolling(false);
    }, SCROLL_TIMEOUT);
  });

  const handlePointerDown = useEventCallback((event: React.PointerEvent) => {
    thumbDraggingRef.current = true;
    startYRef.current = event.clientY;
    startXRef.current = event.clientX;
    currentOrientationRef.current = event.currentTarget.getAttribute('data-orientation') as
      | 'vertical'
      | 'horizontal';

    if (viewportRef.current) {
      startScrollTopRef.current = viewportRef.current.scrollTop;
      startScrollLeftRef.current = viewportRef.current.scrollLeft;
    }
    if (thumbYRef.current && currentOrientationRef.current === 'vertical') {
      thumbYRef.current.setPointerCapture(event.pointerId);
    }
    if (thumbXRef.current && currentOrientationRef.current === 'horizontal') {
      thumbXRef.current.setPointerCapture(event.pointerId);
    }
  });

  const handlePointerMove = useEventCallback((event: React.PointerEvent) => {
    if (!thumbDraggingRef.current) {
      return;
    }

    const deltaY = event.clientY - startYRef.current;
    const deltaX = event.clientX - startXRef.current;

    if (viewportRef.current) {
      const scrollableContentHeight = viewportRef.current.scrollHeight;
      const viewportHeight = viewportRef.current.clientHeight;
      const scrollableContentWidth = viewportRef.current.scrollWidth;
      const viewportWidth = viewportRef.current.clientWidth;

      if (
        thumbYRef.current &&
        scrollbarYRef.current &&
        currentOrientationRef.current === 'vertical'
      ) {
        const thumbHeight = thumbYRef.current.offsetHeight;
        const maxThumbOffsetY = scrollbarYRef.current.offsetHeight - thumbHeight;
        const scrollRatioY = deltaY / maxThumbOffsetY;
        viewportRef.current.scrollTop =
          startScrollTopRef.current + scrollRatioY * (scrollableContentHeight - viewportHeight);
        event.preventDefault();
        setScrolling(true);
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          setScrolling(false);
        }, SCROLL_TIMEOUT);
      }

      if (
        thumbXRef.current &&
        scrollbarXRef.current &&
        currentOrientationRef.current === 'horizontal'
      ) {
        const thumbWidth = thumbXRef.current.offsetWidth;
        const maxThumbOffsetX = scrollbarXRef.current.offsetWidth - thumbWidth;
        const scrollRatioX = deltaX / maxThumbOffsetX;
        viewportRef.current.scrollLeft =
          startScrollLeftRef.current + scrollRatioX * (scrollableContentWidth - viewportWidth);
        event.preventDefault();
        setScrolling(true);
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          setScrolling(false);
        }, SCROLL_TIMEOUT);
      }
    }
  });

  const handlePointerUp = useEventCallback((event: React.PointerEvent) => {
    thumbDraggingRef.current = false;

    if (thumbYRef.current && currentOrientationRef.current === 'vertical') {
      thumbYRef.current.releasePointerCapture(event.pointerId);
    }
    if (thumbXRef.current && currentOrientationRef.current === 'horizontal') {
      thumbXRef.current.releasePointerCapture(event.pointerId);
    }
  });

  const handlePointerEnterOrMove = useEventCallback(({ pointerType }: React.PointerEvent) => {
    const isTouch = pointerType === 'touch';

    setTouchModality(isTouch);

    if (!isTouch) {
      setHovering(true);
    }
  });

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        dir,
        onPointerEnter: handlePointerEnterOrMove,
        onPointerMove: handlePointerEnterOrMove,
        onPointerDown({ pointerType }) {
          setTouchModality(pointerType === 'touch');
        },
        onPointerLeave() {
          setHovering(false);
        },
        style: {
          position: 'relative',
          ['--scroll-area-corner-width' as string]: `${cornerSize.width}px`,
          ['--scroll-area-corner-height' as string]: `${cornerSize.height}px`,
        },
      }),
    [cornerSize, dir, handlePointerEnterOrMove],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleScroll,
      cornerSize,
      setCornerSize,
      thumbSize,
      setThumbSize,
      touchModality,
      cornerRef,
      scrolling,
      setScrolling,
      hovering,
      setHovering,
      viewportRef,
      scrollbarYRef,
      scrollbarXRef,
      thumbYRef,
      thumbXRef,
      rootId,
      hiddenState,
      setHiddenState,
    }),
    [
      getRootProps,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleScroll,
      cornerSize,
      thumbSize,
      touchModality,
      cornerRef,
      scrolling,
      hovering,
      setHovering,
      viewportRef,
      scrollbarYRef,
      scrollbarXRef,
      thumbYRef,
      thumbXRef,
      rootId,
      hiddenState,
    ],
  );
}

export namespace useScrollAreaRoot {
  export interface Parameters {
    dir: string | undefined;
    gutter: number | string;
  }
}
