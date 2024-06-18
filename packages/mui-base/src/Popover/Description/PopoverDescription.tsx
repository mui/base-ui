'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import type { PopoverDescriptionProps } from './PopoverDescription.types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';

/**
 * Renders a description element that describes the popover.
 *
 * Demos:
 *
 * - [Popover](https://mui.com/base-ui/react-popover/)
 *
 * API:
 *
 * - [PopoverDescription API](https://mui.com/base-ui/react-popover/components-api/#popover-description)
 */
const PopoverDescription = React.forwardRef(function PopoverDescription(
  props: PopoverDescriptionProps,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setDescriptionId, getDescriptionProps } = usePopoverRootContext();

  const id = useId(otherProps.id);

  useEnhancedEffect(() => {
    setDescriptionId(id);
    return () => {
      setDescriptionId(undefined);
    };
  }, [setDescriptionId, id]);

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
