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
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
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
     * Whether to keep the HTML element in the DOM when the viewport isn’t scrollable.
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to keep the HTML element in the DOM when the viewport isn’t scrollable.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The orientation of the scrollbar.
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the default HTML element that the component
   * renders with another element, or compose it with another component.
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ScrollAreaScrollbar };
