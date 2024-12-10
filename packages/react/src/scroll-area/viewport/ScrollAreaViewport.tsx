'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';
import { useScrollAreaViewport } from './useScrollAreaViewport';

const state = {};

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaViewport = React.forwardRef(function ScrollAreaViewport(
  props: ScrollAreaViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...otherProps } = props;

  const { viewportRef } = useScrollAreaRootContext();
  const { getViewportProps } = useScrollAreaViewport({ children });

  const mergedRef = useForkRef(forwardedRef, viewportRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getViewportProps,
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace ScrollAreaViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
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
