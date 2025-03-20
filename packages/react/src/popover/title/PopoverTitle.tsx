'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverTitle } from './usePopoverTitle';

const state = {};

/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverTitle };
