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
  const { render, className, dir, gutter = 0, ...otherProps } = props;

  const scrollAreaRoot = useScrollAreaRoot({ dir, gutter });

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
      gutter,
      ...scrollAreaRoot,
    }),
    [dir, gutter, scrollAreaRoot],
  );

  const viewportId = `[data-id="${rootId}-viewport"]`;

  const html = React.useMemo(
    () => ({
      __html: `${viewportId}{scrollbar-width:none}${viewportId}::-webkit-scrollbar{display:none}`,
    }),
    [viewportId],
  );

  return (
    <ScrollAreaRootContext.Provider value={contextValue}>
      {rootId && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={html}
        />
      )}
      {renderElement()}
    </ScrollAreaRootContext.Provider>
  );
});

namespace ScrollAreaRoot {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Determines the space to account for inset scrollbars.
     * @default 0
     */
    gutter?: number | string;
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
   * Determines the space to account for inset scrollbars.
   * @default 0
   */
  gutter: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ScrollAreaRoot };
