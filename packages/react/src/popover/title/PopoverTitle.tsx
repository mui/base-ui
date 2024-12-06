'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverTitle } from './usePopoverTitle';

const state = {};

/**
 * Renders a title element that labels the popover.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.com/components/react-popover/)
 *
 * API:
 *
 * - [PopoverTitle API](https://base-ui.com/components/react-popover/#api-reference-PopoverTitle)
 */
const PopoverTitle = React.forwardRef(function PopoverTitle(
  props: PopoverTitle.Props,
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
    state,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace PopoverTitle {
  export interface State {}

  export interface Props
    extends BaseUIComponentProps<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', State> {}
}

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
