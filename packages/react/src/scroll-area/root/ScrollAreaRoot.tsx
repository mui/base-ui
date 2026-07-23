'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { ScrollAreaRootContext } from './ScrollAreaRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { SCROLL_TIMEOUT } from '../constants';
import { getOffset } from '../utils/getOffset';
import { styleDisableScrollbar } from '../../utils/styles';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { scrollAreaStateAttributesMapping } from './stateAttributes';
import { contains } from '../../floating-ui-react/utils';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import * as ScrollAreaRootCssVars from './ScrollAreaRootCssVars';
import * as ScrollAreaScrollbarDataAttributes from '../scrollbar/ScrollAreaScrollbarDataAttributes';

const DEFAULT_COORDS = { x: 0, y: 0 };
const DEFAULT_SIZE = { width: 0, height: 0 };
const DEFAULT_OVERFLOW_EDGES = { xStart: false, xEnd: false, yStart: false, yEnd: false };
const DEFAULT_HIDDEN_STATE = { x: true, y: true, corner: true };

export type HiddenState = typeof DEFAULT_HIDDEN_STATE;
export type OverflowEdges = typeof DEFAULT_OVERFLOW_EDGES;
export type Size = typeof DEFAULT_SIZE;
export type Coords = typeof DEFAULT_COORDS;

/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaRoot = React.forwardRef(function ScrollAreaRoot(
  componentProps: ScrollAreaRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    overflowEdgeThreshold: overflowEdgeThresholdProp,
    style,
    ...elementProps
  } = componentProps;

  const { xStart, xEnd, yStart, yEnd } = normalizeOverflowEdgeThreshold(overflowEdgeThresholdProp);

  const rootId = useBaseUiId();

  const scrollYTimeout = useTimeout();
  const scrollXTimeout = useTimeout();

  const { nonce, disableStyleElements } = useCSPContext();

  const [hovering, setHovering] = React.useState(false);
  const [scrollingX, setScrollingX] = React.useState(false);
  const [scrollingY, setScrollingY] = React.useState(false);
  const [touchModality, setTouchModality] = React.useState(false);
  const [hasMeasuredScrollbar, setHasMeasuredScrollbar] = React.useState(false);
  const [cornerSize, setCornerSize] = React.useState<Size>(DEFAULT_SIZE);
  const [thumbSize, setThumbSize] = React.useState<Size>(DEFAULT_SIZE);
  const [overflowEdges, setOverflowEdges] = React.useState(DEFAULT_OVERFLOW_EDGES);
  const [hiddenState, setHiddenState] = React.useState(DEFAULT_HIDDEN_STATE);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
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
  const scrollPositionRef = React.useRef(DEFAULT_COORDS);
  const savedSnapTypeRef = React.useRef<string | null>(null);

  function startScrolling(vertical: boolean) {
    const setScrolling = vertical ? setScrollingY : setScrollingX;
    const timeout = vertical ? scrollYTimeout : scrollXTimeout;

    setScrolling(true);
    timeout.start(SCROLL_TIMEOUT, () => {
      setScrolling(false);
    });
  }

  const handleScroll = useStableCallback((scrollPosition: Coords) => {
    const offsetX = scrollPosition.x - scrollPositionRef.current.x;
    const offsetY = scrollPosition.y - scrollPositionRef.current.y;

    scrollPositionRef.current = scrollPosition;

    if (offsetY !== 0) {
      startScrolling(true);
    }

    if (offsetX !== 0) {
      startScrolling(false);
    }
  });

  // CSS scroll snap forces every programmatic scroll to land on a snap
  // point, making thumb dragging jump between snap points. Native
  // scrollbars suppress snapping while dragging, so disable it until the
  // pointer is released; restoring the value re-snaps the viewport. The
  // save is guarded so a second pointer during an active drag can't
  // clobber the saved value with `none`.
  const disableViewportSnap = useStableCallback(() => {
    const viewportEl = viewportRef.current;
    if (viewportEl && savedSnapTypeRef.current === null) {
      savedSnapTypeRef.current = viewportEl.style.scrollSnapType;
      viewportEl.style.scrollSnapType = 'none';
    }
  });

  const handlePointerDown = useStableCallback((event: React.PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    thumbDraggingRef.current = true;
    startYRef.current = event.clientY;
    startXRef.current = event.clientX;
    currentOrientationRef.current = event.currentTarget.getAttribute(
      ScrollAreaScrollbarDataAttributes.orientation,
    ) as 'vertical' | 'horizontal';

    const viewportEl = viewportRef.current;
    if (viewportEl) {
      startScrollTopRef.current = viewportEl.scrollTop;
      startScrollLeftRef.current = viewportEl.scrollLeft;
      disableViewportSnap();
    }

    const thumb =
      currentOrientationRef.current === 'vertical' ? thumbYRef.current : thumbXRef.current;
    thumb?.setPointerCapture(event.pointerId);
  });

  const handlePointerMove = useStableCallback((event: React.PointerEvent) => {
    if (!thumbDraggingRef.current) {
      return;
    }

    const viewportEl = viewportRef.current;
    if (!viewportEl) {
      return;
    }

    const vertical = currentOrientationRef.current === 'vertical';
    const thumbEl = vertical ? thumbYRef.current : thumbXRef.current;
    const scrollbarEl = vertical ? scrollbarYRef.current : scrollbarXRef.current;
    if (!thumbEl || !scrollbarEl) {
      return;
    }

    const axis = vertical ? 'y' : 'x';
    const scrollbarOffset = getOffset(scrollbarEl, 'padding', axis);
    const thumbOffset = getOffset(thumbEl, 'margin', axis);
    const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
    const trackSize = vertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;
    const maxThumbOffset = trackSize - thumbSizePx - scrollbarOffset - thumbOffset;
    // A short or heavily padded track can drive `maxThumbOffset` to zero or
    // negative once the thumb hits its `MIN_THUMB_SIZE` floor. Dividing by it
    // would yield a non-finite (`Infinity`/`NaN`) or inverted scroll position.
    const delta = vertical ? event.clientY - startYRef.current : event.clientX - startXRef.current;
    const scrollRatio = maxThumbOffset <= 0 ? 0 : delta / maxThumbOffset;

    const scrollableSize = vertical ? viewportEl.scrollHeight : viewportEl.scrollWidth;
    const viewportSize = vertical ? viewportEl.clientHeight : viewportEl.clientWidth;
    const startScroll = vertical ? startScrollTopRef.current : startScrollLeftRef.current;
    const nextScroll = startScroll + scrollRatio * (scrollableSize - viewportSize);

    if (vertical) {
      viewportEl.scrollTop = nextScroll;
    } else {
      viewportEl.scrollLeft = nextScroll;
    }
    event.preventDefault();

    startScrolling(vertical);
  });

  const handlePointerUp = useStableCallback((event: React.PointerEvent) => {
    thumbDraggingRef.current = false;

    if (savedSnapTypeRef.current !== null) {
      if (viewportRef.current) {
        viewportRef.current.style.scrollSnapType = savedSnapTypeRef.current;
      }
      savedSnapTypeRef.current = null;
    }

    const thumb =
      currentOrientationRef.current === 'vertical' ? thumbYRef.current : thumbXRef.current;
    // `pointercancel` releases capture implicitly, so guard against releasing a
    // capture we no longer hold (which would throw).
    if (thumb?.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }
  });

  function handleTouchModalityChange(event: React.PointerEvent) {
    setTouchModality(event.pointerType === 'touch');
  }

  function handlePointerEnterOrMove(event: React.PointerEvent) {
    handleTouchModalityChange(event);

    if (event.pointerType !== 'touch') {
      const isTargetRootChild = contains(rootRef.current, event.target as Element);
      setHovering(isTargetRootChild);
    }
  }

  const state: ScrollAreaRootState = React.useMemo(
    () => ({
      scrolling: scrollingX || scrollingY,
      hasOverflowX: !hiddenState.x,
      hasOverflowY: !hiddenState.y,
      overflowXStart: overflowEdges.xStart,
      overflowXEnd: overflowEdges.xEnd,
      overflowYStart: overflowEdges.yStart,
      overflowYEnd: overflowEdges.yEnd,
      cornerHidden: hiddenState.corner,
    }),
    [scrollingX, scrollingY, hiddenState.x, hiddenState.y, hiddenState.corner, overflowEdges],
  );

  const props: HTMLProps = {
    role: 'presentation',
    onPointerEnter: handlePointerEnterOrMove,
    onPointerMove: handlePointerEnterOrMove,
    onPointerDown: handleTouchModalityChange,
    onPointerLeave() {
      setHovering(false);
    },
    style: {
      position: 'relative',
      [ScrollAreaRootCssVars.scrollAreaCornerHeight as string]: `${cornerSize.height}px`,
      [ScrollAreaRootCssVars.scrollAreaCornerWidth as string]: `${cornerSize.width}px`,
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [props, elementProps],
    stateAttributesMapping: scrollAreaStateAttributesMapping,
  });

  const contextValue = React.useMemo(
    () => ({
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleScroll,
      disableViewportSnap,
      cornerSize,
      setCornerSize,
      thumbSize,
      setThumbSize,
      hasMeasuredScrollbar,
      setHasMeasuredScrollbar,
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
      overflowEdges,
      setOverflowEdges,
      viewportState: state,
      overflowEdgeThreshold: { xStart, xEnd, yStart, yEnd },
    }),
    [
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleScroll,
      disableViewportSnap,
      cornerSize,
      thumbSize,
      hasMeasuredScrollbar,
      touchModality,
      scrollingX,
      scrollingY,
      hovering,
      rootId,
      hiddenState,
      overflowEdges,
      state,
      xStart,
      xEnd,
      yStart,
      yEnd,
    ],
  );

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {!disableStyleElements && styleDisableScrollbar.getElement(nonce)}
      {element}
    </ScrollAreaRootContext.Provider>
  );
});

export interface ScrollAreaRootState {
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean;
  /**
   * Whether horizontal overflow is present.
   */
  hasOverflowX: boolean;
  /**
   * Whether vertical overflow is present.
   */
  hasOverflowY: boolean;
  /**
   * Whether there is overflow on the inline start side for the horizontal axis.
   */
  overflowXStart: boolean;
  /**
   * Whether there is overflow on the inline end side for the horizontal axis.
   */
  overflowXEnd: boolean;
  /**
   * Whether there is overflow on the block start side.
   */
  overflowYStart: boolean;
  /**
   * Whether there is overflow on the block end side.
   */
  overflowYEnd: boolean;
  /**
   * Whether the scrollbar corner is hidden.
   */
  cornerHidden: boolean;
}

export interface ScrollAreaRootProps extends BaseUIComponentProps<'div', ScrollAreaRootState> {
  /**
   * The threshold in pixels that must be passed before the overflow edge attributes are applied.
   * Accepts a single number for all edges or an object to configure them individually.
   * @default 0
   */
  overflowEdgeThreshold?:
    | number
    | Partial<{
        xStart: number;
        xEnd: number;
        yStart: number;
        yEnd: number;
      }>
    | undefined;
}

export namespace ScrollAreaRoot {
  export type State = ScrollAreaRootState;
  export type Props = ScrollAreaRootProps;
}

function normalizeOverflowEdgeThreshold(
  threshold: ScrollAreaRoot.Props['overflowEdgeThreshold'] | undefined,
) {
  const thresholds =
    typeof threshold === 'number'
      ? { xStart: threshold, xEnd: threshold, yStart: threshold, yEnd: threshold }
      : threshold;

  return {
    xStart: Math.max(0, thresholds?.xStart || 0),
    xEnd: Math.max(0, thresholds?.xEnd || 0),
    yStart: Math.max(0, thresholds?.yStart || 0),
    yEnd: Math.max(0, thresholds?.yEnd || 0),
  };
}
