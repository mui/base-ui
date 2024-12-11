'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverClose } from './usePopoverClose';

const state = {};

/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
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
    state,
    extraProps: otherProps,
    ref: forwardedRef,
  });

  return renderElement();
});

namespace PopoverClose {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
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
