'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { contains, getTarget } from '../../floating-ui-react/utils';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { getOffset } from '../utils/getOffset';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { scrollAreaStateAttributesMapping } from '../root/stateAttributes';
import type { ScrollAreaRootState } from '../root/ScrollAreaRoot';

/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaScrollbar = React.forwardRef(function ScrollAreaScrollbar(
  componentProps: ScrollAreaScrollbar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    orientation = 'vertical',
    keepMounted = false,
    style,
    ...elementProps
  } = componentProps;

  const {
    hovering,
    scrollingX,
    scrollingY,
    hiddenState,
    scrollbarYRef,
    scrollbarXRef,
    viewportRef,
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerUp,
    handleScroll,
    disableViewportSnap,
    rootId,
    thumbSize,
    hasMeasuredScrollbar,
    viewportState,
  } = useScrollAreaRootContext();

  const vertical = orientation === 'vertical';

  const state: ScrollAreaScrollbarState = {
    ...viewportState,
    hovering,
    scrolling: vertical ? scrollingY : scrollingX,
    orientation,
  };

  const direction = useDirection();
  const hideTrackUntilMeasured = !hasMeasuredScrollbar && !keepMounted;
  const isHidden = vertical ? hiddenState.y : hiddenState.x;
  const shouldRender = keepMounted || !isHidden;

  React.useEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    const viewportEl = viewportRef.current;
    const scrollbarEl = vertical ? scrollbarYRef.current : scrollbarXRef.current;

    if (!scrollbarEl) {
      return undefined;
    }

    function handleWheel(event: WheelEvent) {
      if (!viewportEl || !scrollbarEl || event.ctrlKey) {
        return;
      }

      const horizontal = !vertical;
      const scrollProperty = horizontal ? 'scrollLeft' : 'scrollTop';
      const delta = horizontal ? event.deltaX : event.deltaY;
      if (delta === 0) {
        return;
      }

      const maxScroll = horizontal
        ? viewportEl.scrollWidth - viewportEl.clientWidth
        : viewportEl.scrollHeight - viewportEl.clientHeight;
      // RTL horizontal scrolling uses a negative `scrollLeft` range, from 0 to `-maxScroll`.
      const minScroll = horizontal && direction === 'rtl' ? -maxScroll : 0;
      const maxScrollValue = horizontal && direction === 'rtl' ? 0 : maxScroll;
      const scrollValue = viewportEl[scrollProperty];

      // At an edge (or with no overflow), let the wheel event chain to the
      // parent/page instead of swallowing it via `preventDefault`.
      if ((scrollValue <= minScroll && delta < 0) || (scrollValue >= maxScrollValue && delta > 0)) {
        return;
      }

      event.preventDefault();

      viewportEl[scrollProperty] = Math.min(
        maxScrollValue,
        Math.max(minScroll, scrollValue + delta),
      );

      handleScroll({ x: viewportEl.scrollLeft, y: viewportEl.scrollTop });
    }

    return addEventListener(scrollbarEl, 'wheel', handleWheel, { passive: false });
  }, [direction, handleScroll, vertical, scrollbarXRef, scrollbarYRef, shouldRender, viewportRef]);

  const props: HTMLProps = {
    ...(rootId && { 'data-id': `${rootId}-scrollbar` }),
    onPointerDown(event) {
      if (event.button !== 0) {
        return;
      }

      const target = getTarget(event.nativeEvent) as Element | null;
      const thumbEl = vertical ? thumbYRef.current : thumbXRef.current;

      // Ignore clicks on thumb, including cases where React retargets the
      // synthetic event to the track host across a shadow boundary.
      if (thumbEl && contains(thumbEl, target)) {
        return;
      }

      const viewportEl = viewportRef.current;
      if (!viewportEl) {
        return;
      }

      const scrollbarEl = vertical ? scrollbarYRef.current : scrollbarXRef.current;

      if (thumbEl && scrollbarEl) {
        const axis = vertical ? 'y' : 'x';
        const thumbOffset = getOffset(thumbEl, 'margin', axis);
        const scrollbarOffset = getOffset(scrollbarEl, 'padding', axis);
        const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
        const trackRect = scrollbarEl.getBoundingClientRect();
        const clickPosition = vertical
          ? event.clientY - trackRect.top - thumbSizePx / 2 - scrollbarOffset + thumbOffset / 2
          : event.clientX - trackRect.left - thumbSizePx / 2 - scrollbarOffset + thumbOffset / 2;

        const scrollableSize = vertical ? viewportEl.scrollHeight : viewportEl.scrollWidth;
        const viewportSize = vertical ? viewportEl.clientHeight : viewportEl.clientWidth;
        const trackSize = vertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;

        const maxThumbOffset = trackSize - thumbSizePx - scrollbarOffset - thumbOffset;
        // A short or heavily padded track can drive `maxThumbOffset` to zero or
        // negative once the thumb hits its `MIN_THUMB_SIZE` floor. Dividing by it
        // would yield a non-finite (`Infinity`/`NaN`) or inverted scroll position.
        if (maxThumbOffset <= 0) {
          return;
        }

        const scrollRatio = clickPosition / maxThumbOffset;
        const maxScrollDistance = scrollableSize - viewportSize;

        // Disable snapping before the jump-to-click assignment, or the
        // assigned position quantizes to the nearest snap point and the thumb
        // stays offset from the pointer for the whole drag. `handlePointerDown`
        // below re-runs this as a guarded no-op for the thumb-drag path.
        disableViewportSnap();

        if (vertical) {
          viewportEl.scrollTop = scrollRatio * maxScrollDistance;
        } else if (direction === 'rtl') {
          // In RTL, invert the scroll direction
          let newScrollLeft = (1 - scrollRatio) * maxScrollDistance;

          // Adjust for browsers that use negative scrollLeft in RTL
          if (viewportEl.scrollLeft <= 0) {
            newScrollLeft = -newScrollLeft;
          }

          viewportEl.scrollLeft = newScrollLeft;
        } else {
          viewportEl.scrollLeft = scrollRatio * maxScrollDistance;
        }
      }

      handleScroll({ x: viewportEl.scrollLeft, y: viewportEl.scrollTop });

      handlePointerDown(event);
    },
    onPointerUp: handlePointerUp,
    // Mirror `onPointerUp` so a browser-cancelled gesture on the track (no thumb
    // child captures the pointer) still clears the drag state.
    onPointerCancel: handlePointerUp,
    style: {
      position: 'absolute',
      touchAction: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      visibility: hideTrackUntilMeasured ? 'hidden' : undefined,
      ...(vertical
        ? {
            top: 0,
            bottom: 'var(--scroll-area-corner-height)',
            insetInlineEnd: 0,
            ['--scroll-area-thumb-height' as string]: `${thumbSize.height}px`,
          }
        : {
            insetInlineStart: 0,
            insetInlineEnd: 'var(--scroll-area-corner-width)',
            bottom: 0,
            ['--scroll-area-thumb-width' as string]: `${thumbSize.width}px`,
          }),
    },
  };

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, vertical ? scrollbarYRef : scrollbarXRef],
    state,
    props: [props, elementProps],
    stateAttributesMapping: scrollAreaStateAttributesMapping,
  });

  if (!shouldRender) {
    return null;
  }

  return (
    <ScrollAreaScrollbarContext.Provider value={orientation}>
      {element}
    </ScrollAreaScrollbarContext.Provider>
  );
});

export interface ScrollAreaScrollbarState extends ScrollAreaRootState {
  /**
   * Whether the scroll area is being hovered.
   */
  hovering: boolean;
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean;
  /**
   * The orientation of the scrollbar.
   */
  orientation: 'vertical' | 'horizontal';
}

export interface ScrollAreaScrollbarProps extends BaseUIComponentProps<
  'div',
  ScrollAreaScrollbarState
> {
  /**
   * Whether the scrollbar controls vertical or horizontal scroll.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /**
   * Whether to keep the HTML element in the DOM when the viewport isn't scrollable.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ScrollAreaScrollbar {
  export type State = ScrollAreaScrollbarState;
  export type Props = ScrollAreaScrollbarProps;
}
