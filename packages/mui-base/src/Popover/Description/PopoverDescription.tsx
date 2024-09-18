'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import type { PopoverDescriptionProps } from './PopoverDescription.types';
import { usePopoverDescription } from './usePopoverDescription';

/**
 * Renders a description element that describes the popover.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverDescription API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverDescription)
 */
const PopoverDescription = React.forwardRef(function PopoverDescription(
  props: PopoverDescriptionProps,
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
    ownerState: {},
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return renderElement();
});

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
