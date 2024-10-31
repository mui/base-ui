'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ScrollAreaRootContext } from './ScrollAreaRootContext';
import { useScrollAreaRoot } from './useScrollAreaRoot';

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
  const { render, className, dir, type = 'overlay', gutter = 'stable', ...otherProps } = props;

  const scrollAreaRoot = useScrollAreaRoot({ dir, type, gutter });

  const { rootId } = scrollAreaRoot;

  const { renderElement } = useComponentRenderer({
    propGetter: scrollAreaRoot.getRootProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
  });

  const contextValue = React.useMemo(
    () => ({
      dir,
      type,
      gutter,
      ...scrollAreaRoot,
    }),
    [dir, gutter, type, scrollAreaRoot],
  );

  const viewportId = `[id="${rootId}-viewport"]`;
  const scrollbarId = `[id="${rootId}-scrollbar"]`;

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {rootId && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `${viewportId},${scrollbarId}{scrollbar-width:none;}${viewportId}::-webkit-scrollbar,${scrollbarId}::-webkit-scrollbar{display:none}`,
          }}
        />
      )}
      {renderElement()}
    </ScrollAreaRootContext.Provider>
  );
});

namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Whether the scrollbars are rendered as overlay (not affecting layout) or inset (affecting
     * layout).
     * @default 'overlay'
     */
    type?: 'overlay' | 'inset';
    /**
     * Determines the permanent scrollbar gutter when using the `inset` type to prevent layout
     * shifts when the scrollbar is hidden/shown.
     * @default 'stable'
     */
    gutter?: 'none' | 'stable';
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
   * Determines the permanent scrollbar gutter when using the `inset` type to prevent layout
   * shifts when the scrollbar is hidden/shown.
   * @default 'stable'
   */
  gutter: PropTypes.oneOf(['none', 'stable']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Whether the scrollbars are rendered as overlay (not affecting layout) or inset (affecting
   * layout).
   * @default 'overlay'
   */
  type: PropTypes.oneOf(['inset', 'overlay']),
} as any;

export { ScrollAreaRoot };
