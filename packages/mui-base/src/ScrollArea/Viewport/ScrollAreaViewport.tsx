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
  const { render, className, ...otherProps } = props;

  const { viewportRef, scrollbarYRef, scrollbarXRef, thumbYRef, thumbXRef, setScrolling } =
    useScrollAreaRootContext();

  const timeoutRef = React.useRef(-1);

  const mergedRef = useForkRef(forwardedRef, viewportRef);

  const computeThumb = useEventCallback(() => {
    const viewportEl = viewportRef.current;
    const scrollbarYEl = scrollbarYRef.current;
    const scrollbarXEl = scrollbarXRef.current;
    const thumbYEl = thumbYRef.current;
    const thumbXEl = thumbXRef.current;

    if (!viewportEl) {
      return;
    }

    const scrollableContentHeight = viewportEl.scrollHeight;
    const scrollableContentWidth = viewportEl.scrollWidth;
    const viewportHeight = viewportEl.clientHeight;
    const viewportWidth = viewportEl.clientWidth;
    const scrollTop = viewportEl.scrollTop;
    const scrollLeft = viewportEl.scrollLeft;

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

      scrollbarYEl.style.setProperty(
        '--scroll-area-thumb-height',
        `${(viewportHeight / scrollableContentHeight) * viewportHeight}px`,
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

      scrollbarXEl.style.setProperty(
        '--scroll-area-thumb-width',
        `${(viewportWidth / scrollableContentWidth) * viewportWidth}px`,
      );
    }
  });

  useEnhancedEffect(() => {
    // Wait for the scrollbar-related refs to be set.
    queueMicrotask(computeThumb);
  }, [computeThumb]);

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
          style={{
            minWidth: '100%',
            display: 'table',
          }}
        >
          {props.children}
        </div>
      ),
    }),
  });

  return renderElement();
});

namespace ScrollAreaViewport {
  export interface OwnerState {}

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
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
