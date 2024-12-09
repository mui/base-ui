'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverDescription } from './usePopoverDescription';
import type { BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 * Renders a description element that describes the popover.
 */
const PopoverDescription = React.forwardRef(function PopoverDescription(
  props: PopoverDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setDescriptionId } = usePopoverRootContext();

  const { getDescriptionProps } = usePopoverDescription({
    descriptionId: otherProps.id,
    setDescriptionId,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getDescriptionProps,
    render: render ?? 'p',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace PopoverDescription {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'p', State> {}
}

PopoverDescription.propTypes /* remove-proptypes */ = {
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

export { PopoverDescription };
