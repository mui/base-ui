'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import type { BaseUIComponentProps } from '../../utils/types.js';
import { usePopoverRootContext } from '../Root/PopoverRootContext.js';
import { usePopoverClose } from './usePopoverClose.js';

const ownerState = {};

/**
 * Renders a button that closes the popover when clicked.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverClose API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverClose)
 */
const PopoverClose = React.forwardRef(function PopoverClose(
  props: PopoverClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setOpen } = usePopoverRootContext();

  const { getCloseProps } = usePopoverClose({
    onClose() {
      setOpen(false);
    },
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getCloseProps,
    render: render ?? 'button',
    className,
    ownerState,
    extraProps: otherProps,
    ref: forwardedRef,
  });

  return renderElement();
});

namespace PopoverClose {
  export interface OwnerState {}

  export interface Props extends BaseUIComponentProps<'button', OwnerState> {}
}

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
