'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { PopoverTitleProps } from './PopoverTitle.types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { usePopoverTitle } from './usePopoverTitle';

/**
 * Renders a title element that labels the popover.
 *
 * Demos:
 *
 * - [Popover](https://mui.com/base-ui/react-popover/)
 *
 * API:
 *
 * - [PopoverTitle API](https://mui.com/base-ui/react-popover/components-api/#popover-title)
 */
const PopoverTitle = React.forwardRef(function PopoverTitle(
  props: PopoverTitleProps,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setTitleId } = usePopoverRootContext();

  const { getTitleProps } = usePopoverTitle({
    titleId: otherProps.id,
    setTitleId,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getTitleProps,
    render: render ?? 'h2',
    className,
    ownerState: {},
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

PopoverTitle.propTypes /* remove-proptypes */ = {
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
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverTitle };
