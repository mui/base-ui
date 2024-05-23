'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { TooltipPopupRootProps } from './TooltipPopupRoot.types';

/**
 * The tooltip popup root element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipPopupRoot API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-popup-root)
 */
const TooltipPopupRoot = React.forwardRef(function TooltipPopupRoot(
  props: TooltipPopupRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, container, ...otherProps } = props;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState: {},
    ref: forwardedRef,
    extraProps: {
      role: 'presentation',
      ...otherProps,
    },
  });

  return <FloatingPortal root={container}>{renderElement()}</FloatingPortal>;
});

TooltipPopupRoot.propTypes /* remove-proptypes */ = {
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
   * The container element to which the tooltip content will be appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TooltipPopupRoot };
