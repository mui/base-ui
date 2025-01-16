import * as React from 'react';
import { useEventCallback } from '../../utils/useEventCallback';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { SCROLL_TIMEOUT } from '../constants';
import { getOffset } from '../utils/getOffset';
import { ScrollAreaRootCssVars } from './ScrollAreaRootCssVars';

interface Size {
  width: number;
  height: number;
}

export function useScrollAreaRoot() {
  const [hovering, setHovering] = React.useState(false);
  const [scrollingX, setScrollingX] = React.useState(false);
  const [scrollingY, setScrollingY] = React.useState(false);
  const [cornerSize, setCornerSize] = React.useState<Size>({ width: 0, height: 0 });
  const [thumbSize, setThumbSize] = React.useState<Size>({ width: 0, height: 0 });
  const [touchModality, setTouchModality] = React.useState(false);

  const rootId = useBaseUiId();

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
  const scrollYTimeoutRef = React.useRef(-1);
  const scrollXTimeoutRef = React.useRef(-1);
  const scrollPositionRef = React.useRef({ x: 0, y: 0 });

  const [hiddenState, setHiddenState] = React.useState({
    scrollbarYHidden: false,
    scrollbarXHidden: false,
    cornerHidden: false,
  });

  React.useEffect(() => {
    return () => {
      window.clearTimeout(scrollYTimeoutRef.current);
      window.clearTimeout(scrollXTimeoutRef.current);
    };
  }, []);

  const handleScroll = useEventCallback((scrollPosition: { x: number; y: number }) => {
    const offsetX = scrollPosition.x - scrollPositionRef.current.x;
    const offsetY = scrollPosition.y - scrollPositionRef.current.y;
    scrollPositionRef.current = scrollPosition;

    if (offsetY !== 0) {
      setScrollingY(true);

      window.clearTimeout(scrollYTimeoutRef.current);
      scrollYTimeoutRef.current = window.setTimeout(() => {
        setScrollingY(false);
      }, SCROLL_TIMEOUT);
    }

    if (offsetX !== 0) {
      setScrollingX(true);

      window.clearTimeout(scrollXTimeoutRef.current);
      scrollXTimeoutRef.current = window.setTimeout(() => {
        setScrollingX(false);
      }, SCROLL_TIMEOUT);
    }
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
        const scrollbarYOffset = getOffset(scrollbarYRef.current, 'padding', 'y');
        const thumbYOffset = getOffset(thumbYRef.current, 'margin', 'y');
        const thumbHeight = thumbYRef.current.offsetHeight;
        const maxThumbOffsetY =
          scrollbarYRef.current.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
        const scrollRatioY = deltaY / maxThumbOffsetY;
        viewportRef.current.scrollTop =
          startScrollTopRef.current + scrollRatioY * (scrollableContentHeight - viewportHeight);
        event.preventDefault();

        setScrollingY(true);

        window.clearTimeout(scrollYTimeoutRef.current);
        scrollYTimeoutRef.current = window.setTimeout(() => {
          setScrollingY(false);
        }, SCROLL_TIMEOUT);
      }

      if (
        thumbXRef.current &&
        scrollbarXRef.current &&
        currentOrientationRef.current === 'horizontal'
      ) {
        const scrollbarXOffset = getOffset(scrollbarXRef.current, 'padding', 'x');
        const thumbXOffset = getOffset(thumbXRef.current, 'margin', 'x');
        const thumbWidth = thumbXRef.current.offsetWidth;
        const maxThumbOffsetX =
          scrollbarXRef.current.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
        const scrollRatioX = deltaX / maxThumbOffsetX;
        viewportRef.current.scrollLeft =
          startScrollLeftRef.current + scrollRatioX * (scrollableContentWidth - viewportWidth);
        event.preventDefault();

        setScrollingX(true);

        window.clearTimeout(scrollXTimeoutRef.current);
        scrollXTimeoutRef.current = window.setTimeout(() => {
          setScrollingX(false);
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
          [ScrollAreaRootCssVars.scrollAreaCornerHeight as string]: `${cornerSize.height}px`,
          [ScrollAreaRootCssVars.scrollAreaCornerWidth as string]: `${cornerSize.width}px`,
        },
      }),
    [cornerSize, handlePointerEnterOrMove],
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
      scrollingX,
      setScrollingX,
      scrollingY,
      setScrollingY,
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
      scrollingX,
      setScrollingX,
      scrollingY,
      setScrollingY,
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

export namespace useScrollAreaRoot {}
