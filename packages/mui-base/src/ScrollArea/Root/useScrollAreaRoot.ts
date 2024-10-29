import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { ownerWindow } from '../../utils/owner';

export function useScrollAreaRoot(params: useScrollAreaRoot.Parameters) {
  const { dir: dirProp } = params;

  const [hovering, setHovering] = React.useState(false);
  const [scrolling, setScrolling] = React.useState(false);
  const [cornerSize, setCornerSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

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

  const [hiddenState, setHiddenState] = React.useState({
    scrollbarYHidden: false,
    scrollbarXHidden: false,
    cornerHidden: false,
  });

  const [dir, setDir] = useControlled({
    controlled: dirProp,
    default: dirProp ?? 'ltr',
    name: 'ScrollArea',
  });

  React.useEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    const win = ownerWindow(viewportRef.current);

    function handleResize() {
      if (viewportRef.current) {
        const width = scrollbarYRef.current?.offsetWidth || 0;
        const height = scrollbarXRef.current?.offsetHeight || 0;
        setCornerSize({ width, height });
      }
    }

    handleResize();

    win.addEventListener('resize', handleResize);
    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, []);

  useEnhancedEffect(() => {
    if (viewportRef.current) {
      setDir(getComputedStyle(viewportRef.current).direction);
    }
  }, [setDir]);

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

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        dir,
        onMouseEnter() {
          setHovering(true);
        },
        onMouseLeave() {
          setHovering(false);
        },
        style: {
          position: 'relative',
          ...(cornerSize.width > 0 && {
            '--scroll-area-corner-width': `${cornerSize.width}px`,
          }),
          ...(cornerSize.height > 0 && {
            '--scroll-area-corner-height': `${cornerSize.height}px`,
          }),
        },
      }),
    [cornerSize, dir],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      cornerSize,
      setCornerSize,
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
      cornerSize,
      setCornerSize,
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
    ],
  );
}

export namespace useScrollAreaRoot {
  export interface Parameters {
    dir: string | undefined;
    gutter: string;
    type: string;
  }
}
