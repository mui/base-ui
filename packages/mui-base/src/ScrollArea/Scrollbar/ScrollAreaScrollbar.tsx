'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useScrollAreaRootContext } from '../Root/ScrollAreaRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { ScrollAreaScrollbarContext } from './ScrollAreaScrollbarContext';
import { useScrollAreaScrollbar } from './useScrollAreaScrollbar';

/**
 *
 * Demos:
 *
 * - [Scroll Area](https://base-ui.netlify.app/components/react-scroll-area/)
 *
 * API:
 *
 * - [ScrollAreaScrollbar API](https://base-ui.netlify.app/components/react-scroll-area/#api-reference-ScrollAreaScrollbar)
 */
const ScrollAreaScrollbar = React.forwardRef(function ScrollAreaScrollbar(
  props: ScrollAreaScrollbar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, orientation = 'vertical', ...otherProps } = props;

  const { hovering, scrolling, scrollbarYRef, scrollbarXRef } = useScrollAreaRootContext();

  const mergedRef = useForkRef(
    forwardedRef,
    orientation === 'vertical' ? scrollbarYRef : scrollbarXRef,
  );

  const ownerState: ScrollAreaScrollbar.OwnerState = React.useMemo(
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
    ownerState,
    extraProps: otherProps,
  });

  const contextValue = React.useMemo(() => ({ orientation }), [orientation]);

  return (
    <ScrollAreaScrollbarContext.Provider value={contextValue}>
      {renderElement()}
    </ScrollAreaScrollbarContext.Provider>
  );
});

namespace ScrollAreaScrollbar {
  export interface OwnerState {
    hovering: boolean;
    scrolling: boolean;
    orientation: 'vertical' | 'horizontal';
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The orientation of the scrollbar.
     * @default 'vertical'
     */
    orientation?: 'vertical' | 'horizontal';
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
