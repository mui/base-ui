'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useForkRef } from '../../utils/useForkRef';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Scroll Area](https://base-ui.netlify.app/components/react-scroll-area/)
 *
 * API:
 *
 * - [ScrollAreaViewport API](https://base-ui.netlify.app/components/react-scroll-area/#api-reference-ScrollAreaViewport)
 */
const ScrollAreaViewport = React.forwardRef(function ScrollAreaViewport(
  props: ScrollAreaViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...otherProps } = props;

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

  const mergedRef = useForkRef(forwardedRef, viewportRef);
  const tableWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const [paddingX, setPaddingX] = React.useState(0);
  const [hiddenX, setHiddenX] = React.useState(false);
  const [hiddenY, setHiddenY] = React.useState(false);

  useEnhancedEffect(() => {
    if (scrollbarYRef.current) {
      setPaddingX(parseFloat(getComputedStyle(scrollbarYRef.current).width));
    }
  }, [scrollbarYRef, scrollbarXRef]);

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
        setCornerSize({ width: cornerEl.offsetWidth, height: cornerEl.offsetHeight });
      }
    }
  });

  useEnhancedEffect(() => {
    // Wait for the scrollbar-related refs to be set.
    queueMicrotask(computeThumb);
  }, [computeThumb]);

  React.useEffect(() => {
    if (!tableWrapperRef.current) {
      return undefined;
    }

    const ro = new ResizeObserver(computeThumb);
    ro.observe(tableWrapperRef.current);

    return () => {
      ro.disconnect();
    };
  }, [computeThumb]);

  const wrapperStyles: React.CSSProperties = {};

  if (type === 'inlay') {
    if (!hiddenY) {
      wrapperStyles.paddingRight = paddingX;
    }
    if (!hiddenX) {
      wrapperStyles.paddingBottom = paddingX;
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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    ownerState,
    extraProps: mergeReactProps<'div'>(otherProps, {
      onScroll() {
        computeThumb();
        setScrolling(true);

        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          setScrolling(false);
        }, 500);
      },
      style: {
        overflow: 'scroll',
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
  });

  return renderElement();
});

namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}

  export interface OwnerState {}
}

ScrollAreaViewport.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ScrollAreaViewport };
