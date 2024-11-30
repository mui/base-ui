'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { useScrollAreaScrollbar } from './useScrollAreaScrollbar';

/**
 *
 * Demos:
 *
 * - [Scroll Area](https://base-ui.com/components/react-scroll-area/)
 *
 * API:
 *
 * - [ScrollAreaScrollbar API](https://base-ui.com/components/react-scroll-area/#api-reference-ScrollAreaScrollbar)
 */
const ScrollAreaScrollbar = React.forwardRef(function ScrollAreaScrollbar(
  props: ScrollAreaScrollbar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, orientation = 'vertical', keepMounted = false, ...otherProps } = props;

  const { hovering, scrolling, hiddenState, scrollbarYRef, scrollbarXRef } =
    useScrollAreaRootContext();

  const mergedRef = useForkRef(
    forwardedRef,
    orientation === 'vertical' ? scrollbarYRef : scrollbarXRef,
  );

  const state: ScrollAreaScrollbar.State = React.useMemo(
    () => ({
      hovering,
      scrolling,
      orientation,
    }),
    [hovering, scrolling, orientation],
  );

  const { getScrollbarProps } = useScrollAreaScrollbar({
    orientation,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getScrollbarProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: otherProps,
  });

  const contextValue = React.useMemo(() => ({ orientation }), [orientation]);

  const isHidden =
    orientation === 'vertical' ? hiddenState.scrollbarYHidden : hiddenState.scrollbarXHidden;

  const shouldRender = keepMounted || !isHidden;
  if (!shouldRender) {
    return null;
  }

  return (
    <ScrollAreaScrollbarContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaScrollbarContext.Provider>
  );
});

namespace ScrollAreaScrollbar {
  export interface State {
    hovering: boolean;
    scrolling: boolean;
    orientation: 'vertical' | 'horizontal';
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The orientation of the scrollbar.
     * @default 'vertical'
     */
    orientation?: 'vertical' | 'horizontal';
    /**
     * Whether the scrollbars remain mounted in the DOM when there is no overflow.
     * @default false
     */
    keepMounted?: boolean;
  }
}

ScrollAreaScrollbar.propTypes /* remove-proptypes */ = {
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
   * Whether the scrollbars remain mounted in the DOM when there is no overflow.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The orientation of the scrollbar.
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ScrollAreaScrollbar };
