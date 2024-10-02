'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ScrollAreaRootContext } from './ScrollAreaRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useControlled } from '../../utils/useControlled';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Scroll Area](https://base-ui.netlify.app/components/react-scroll-area/)
 *
 * API:
 *
 * - [ScrollAreaRoot API](https://base-ui.netlify.app/components/react-scroll-area/#api-reference-ScrollAreaRoot)
 */
const ScrollAreaRoot = React.forwardRef(function ScrollAreaRoot(
  props: ScrollAreaRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    dir: dirProp,
    type = 'overlay',
    gutter = 'stable',
    ...otherProps
  } = props;

  const [hovering, setHovering] = React.useState(false);
  const [scrolling, setScrolling] = React.useState(false);
  const [cornerSize, setCornerSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

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

  useEnhancedEffect(() => {
    const width = scrollbarYRef.current?.offsetWidth || 0;
    const height = scrollbarXRef.current?.offsetHeight || 0;
    setCornerSize({ width, height });
  }, []);

  const [dir, setDir] = useControlled({
    controlled: dirProp,
    default: dirProp ?? 'ltr',
    name: 'ScrollArea',
  });

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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: mergeReactProps(otherProps, {
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
  });

  const contextValue = React.useMemo(
    () => ({
      dir,
      type,
      gutter,
      cornerSize,
      setCornerSize,
      hovering,
      setHovering,
      scrolling,
      setScrolling,
      viewportRef,
      scrollbarYRef,
      thumbYRef,
      scrollbarXRef,
      thumbXRef,
      cornerRef,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
    }),
    [
      dir,
      type,
      gutter,
      cornerSize,
      hovering,
      scrolling,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
    ],
  );

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaRootContext.Provider>
  );
});

namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The type of scrollbars.
     * @default 'overlay'
     */
    type?: 'overlay' | 'inlay';
    /**
     * Determines the permanent scrollbar gutter when using the `inlay` type to prevent layout
     * shifts when the scrollbar is hidden/shown.
     * @default 'stable'
     */
    gutter?: 'none' | 'stable' | 'both-edges';
  }

  export interface OwnerState {}
}

ScrollAreaRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  dir: PropTypes.string,
  /**
   * Determines the permanent scrollbar gutter when using the `inlay` type to prevent layout
   * shifts when the scrollbar is hidden/shown.
   * @default 'stable'
   */
  gutter: PropTypes.oneOf(['both-edges', 'none', 'stable']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The type of scrollbars.
   * @default 'overlay'
   */
  type: PropTypes.oneOf(['inlay', 'overlay']),
} as any;

export { ScrollAreaRoot };
