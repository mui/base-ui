'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { PopoverCloseProps } from './PopoverClose.types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';

/**
 * Renders a button that will close the popover when clicked.
 *
 * Demos:
 *
 * - [Popover](https://mui.com/base-ui/react-popover/)
 *
 * API:
 *
 * - [PopoverClose API](https://mui.com/base-ui/react-popover/components-api/#popover-close)
 */
const PopoverClose = React.forwardRef(function PopoverClose(
  props: PopoverCloseProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getCloseProps } = usePopoverRootContext();

  const { renderElement } = useComponentRenderer({
    propGetter: getCloseProps,
    render: render ?? 'button',
    className,
    ownerState: {},
    extraProps: otherProps,
    ref: forwardedRef,
  });

  return renderElement();
});

PopoverClose.propTypes /* remove-proptypes */ = {
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

export { PopoverClose };
